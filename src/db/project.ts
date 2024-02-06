import { pool } from "./connection";

enum EAppFilesStatus {
    NOT_UPLOADED = "NOT_UPLOADED",
    UPLOADED = "UPLOADED",
}

interface IProjectMetaData {
    id: string;
    name?: string;
    appFilesStatus?: EAppFilesStatus;
}

const getProfile = async (id: string) => {
    try {
        const res = await pool.query("SELECT * FROM profiles WHERE id=$1", [id]);
        if (res.rowCount > 0) return res.rows[0] as IProjectMetaData;
        throw new Error("Profile with this ID doesn't exist");
    } catch (err) {
        throw err;
    }
};

const listProfiles = async () => {
    try {
        const res = await pool.query("SELECT * FROM profiles");
        return res.rows;
    } catch (err) {
        throw err;
    }
};

const createProfile = async (projectMetaData: IProjectMetaData) => {
    try {
        await pool.query("INSERT INTO profiles(id, name) values($1, $2)", [projectMetaData.id, projectMetaData.name]);
    } catch (err) {
        throw err;
    }
};

const updateProfile = async (projectMetaData: IProjectMetaData) => {
    try {
        const res = await pool.query("UPDATE profiles SET name=$1 WHERE id=$2", [projectMetaData.name, projectMetaData.id]);
        if (res.rowCount > 0) throw new Error("Profile with this ID doesn't exist");
    } catch (error) {
        throw error;
    }
};

export { EAppFilesStatus, IProjectMetaData, createProfile, updateProfile, getProfile, listProfiles };
