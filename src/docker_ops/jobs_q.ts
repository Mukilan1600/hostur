import { Queue, QueueBaseOptions, Worker } from "bullmq";
import { getAvailablePort, getContainerStatus, updateContainerStatus } from "../db/docker";
import {
    checkContainerExists,
    createContainer,
    getFiles,
    prepareDockerFile,
    startContainer,
    buildImage,
    DockerContainer,
    removeContainer,
    pruneBuilderImages,
} from "./docker_jobs";

enum DOCKER_OPERATIONS {
    BUILD = "BUILD",
    RUN = "RUN",
}

enum CONTAINER_STATUS {
    CREATED = "CREATED",
    BUILDING = "BUILDING",
    STOPPED = "STOPPED",
    STARTING = "STARTING",
    RUNNING = "RUNNING",
}

const opts: QueueBaseOptions | WorkerOptions = {
    connection: { host: process.env.REDIS_HOST, port: process.env.REDIS_PORT },
};

const docker_Q = new Queue("docker", opts);

const docker_W = new Worker(
    "docker",
    async (job) => {
        const { name, data } = job;
        const dockerContainer: DockerContainer = await getContainerStatus(data.id);
        switch (name) {
            case DOCKER_OPERATIONS.BUILD:
                await prepareDockerFile(data.id);
                await buildImage(data.id);
                await pruneBuilderImages();

                dockerContainer.status = CONTAINER_STATUS.STOPPED;
                await updateContainerStatus(dockerContainer);

                const auxContainer = await checkContainerExists(dockerContainer.id);
                if (auxContainer !== null) {
                    try {
                        await auxContainer.stop();
                        await auxContainer.remove();
                    } catch (err) {}
                }

                await docker_Q.add(DOCKER_OPERATIONS.RUN, job.data);
                break;
            case DOCKER_OPERATIONS.RUN:
                let container = await checkContainerExists(dockerContainer.id);
                if (container === null) container = await createContainer(dockerContainer);
                await startContainer(container);
                break;
        }
    },
    opts
);

docker_W.on("active", (job) => {
    console.log("Active:", job.name);
});

docker_W.on("completed", (job) => {
    console.log("Completed:", job.name);
});

docker_W.on("failed", (job, err) => {
    console.log("Failed:", err);
});

export { docker_Q, DOCKER_OPERATIONS, CONTAINER_STATUS };
