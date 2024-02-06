import Dockerode from "dockerode";
import fs from "fs";
import tar from "tar-fs";

interface DockerContainer {
  id: string;
  status: string;
  port: number;
}

const dockerode = new Dockerode();

const DOCKER_TEMPLATE = (id: string) => `
FROM node:20 AS builder
LABEL stage=builder

WORKDIR /app

COPY ${id}.tar app_files.tar
RUN tar -xvf app_files.tar

RUN npm ci --omit=dev

FROM gcr.io/distroless/nodejs20-debian11

COPY --from=builder /app /app

WORKDIR /app
CMD ["index.js"]
`;

const prepareDockerFile = async (id: string) => {
  const data = Buffer.from(DOCKER_TEMPLATE(id));
  return new Promise<void>((resolve, reject) => {
    const dirName = `${process.env.APP_FILES_DIR}/${id}`;
    fs.writeFile(`${dirName}/Dockerfile`, data, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
};

const buildImage = async (id: string) => {
  const dirName = `${process.env.APP_FILES_DIR}/${id}`;
  const tarFile = tar.pack(dirName);
  const logWrite = fs.createWriteStream(`${dirName}/build-log.txt`);
  const logStream = await dockerode.buildImage(tarFile, { t: id });

  await new Promise((resolve, reject) => {
    dockerode.modem.followProgress(
      logStream,
      (err, res) => {
        logWrite.close();
        return err ? reject(err) : resolve(res);
      },
      (obj) => {
        if ("stream" in obj) logWrite.write(obj["stream"]);
      }
    );
  });
};

const createContainer = async (dockerContainer: DockerContainer) => {
  return await dockerode.createContainer({
    name: dockerContainer.id,
    Image: dockerContainer.id,
    Env: [`PORT=${dockerContainer.port}`],
    ExposedPorts: { [`${dockerContainer.port}/tcp`]: {} },
    HostConfig: {
      PortBindings: {
        [`${dockerContainer.port}/tcp`]: [
          { HostPort: dockerContainer.port.toString() },
        ],
      },
    },
  });
};

const startContainer = async (container: Dockerode.Container) => {
  await container.start();
};

const removeContainer = async (container: Dockerode.Container) => {
  await container.remove();
};

const getContainer = async (id: string) => {
  return dockerode.getContainer(id);
};

const checkContainerExists = async (id: string) => {
  try {
    const container = await getContainer(id);
    await container.inspect();
    return container;
  } catch (err) {
    return null;
  }
};

const getFiles = async (container: Dockerode.Container) => {
  const output = fs.createWriteStream("./t.tar");
  const file = await container.getArchive({ path: "./" });
  file.pipe(output);
  file.on("end", () => console.log("done"));
};

const pruneBuilderImages = async () => {
  try {
    await dockerode.pruneImages({
      filters: {
        label: ["stage=builder"],
      },
    });
  } catch (err) {
    console.error(err);
  }
};

export {
  createContainer,
  startContainer,
  checkContainerExists,
  getFiles,
  prepareDockerFile,
  buildImage,
  removeContainer,
  DockerContainer,
  pruneBuilderImages,
};
