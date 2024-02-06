import { Router } from "express";
import { changeFileStatus } from "../db/files";
import { EAppFilesStatus } from "../db/project";
import { DOCKER_OPERATIONS, docker_Q } from "../docker_ops/jobs_q";
import upload from "../upload";

const router = Router();

const fileUpload = upload.single("file");

router.post("/upload", (req, res) => {
    fileUpload(req, res, async (err) => {
        if (err) return res.status(400).json({ error: err.message });
        try {
            await changeFileStatus(EAppFilesStatus.UPLOADED, req.body.id);

            await docker_Q.add(DOCKER_OPERATIONS.BUILD, { id: req.body.id });
            return res.json({ message: "Uploaded successfully..." });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: "Something went wrong..." });
        }
    });
});

export default router;
