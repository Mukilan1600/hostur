import { pool } from "./connection";
import { EAppFilesStatus } from "./project";

const changeFileStatus = async (status: EAppFilesStatus, id: string) => {
    await pool.query("UPDATE profiles SET app_files_status=$1 where id=$2", [status, id]);
};

export { changeFileStatus };
