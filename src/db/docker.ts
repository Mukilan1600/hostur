import { DockerContainer } from "../docker_ops/docker_jobs";
import { CONTAINER_STATUS } from "../docker_ops/jobs_q";
import { pool } from "./connection";

const updateContainerStatus = async (container: DockerContainer) => {
    await pool.query("UPDATE docker_jobs SET status=$2, port=$3 where id=$1", [container.id, container.status, container.port]);
};

const getContainerStatus = async (id: string): Promise<DockerContainer> => {
    const res = await pool.query("SELECT id,status,port from docker_jobs where id=$1", [id]);
    let container: DockerContainer = res.rows[0];
    if (res.rowCount === 0) {
        container = await createDockerContainer(id);
    }

    return container;
};

const createDockerContainer = async (id: string) => {
    const dockerContainer: DockerContainer = {
        id: id,
        status: CONTAINER_STATUS.CREATED,
        port: await getAvailablePort(),
    };

    await pool.query("INSERT into docker_jobs(id,status,port) values($1,$2,$3)", [
        id,
        dockerContainer.status,
        dockerContainer.port,
    ]);

    return dockerContainer;
};

const getAvailablePort = async () => {
    const res = await pool.query("SELECT distinct port from docker_jobs order by port;");

    if (res.rowCount === 0) return 8000;
    else {
        const ports = res.rows.map((row) => row.port);
        for (let i = 0; i < 500; ++i) {
            if (ports[i] !== i + 8000) return i+8000;
        }
    }

    return 8000;
};

export { getAvailablePort, getContainerStatus, updateContainerStatus };
