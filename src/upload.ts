import multer from "multer";
import fs from 'fs'
import { getProfile } from "./db/project";

const diskStorage = multer.diskStorage({
    destination : (req, file, callback) => {
        const dirName = `${process.env.APP_FILES_DIR}/${req.body.id}`;
        if (!fs.existsSync(dirName)) {
            fs.mkdirSync(dirName, { recursive: true })
          }
        callback(null, dirName)
    },
    filename: (req, file, callback) => {
        const fileName = `${req.body.id}.tar`;
        callback(null, fileName);
    },
});

const upload = multer({
    storage: diskStorage,
    async fileFilter(req, file, callback) {
        try {
            await getProfile(req.body.id);
            console.log(file.mimetype);
            if (file.mimetype !== "application/x-tar") return callback(new Error("Please upload tar files only..."));
            callback(null, true);
        } catch (err) {
            callback(new Error("Invalid ID"));
        }
    },
});

export default upload;
