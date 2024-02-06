import { v4 as uuidv4 } from "uuid";
import { Router } from "express";
import {
  createProfile,
  EAppFilesStatus,
  getProfile,
  IProjectMetaData,
  listProfiles,
  updateProfile,
} from "../db/project";
import { readFileAsStream } from "../util/fileUtil";
import fs from "fs";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const projectInfo: IProjectMetaData = {
      ...req.body,
      id: uuidv4(),
      appFilesStatus: EAppFilesStatus.NOT_UPLOADED,
    };
    if (!projectInfo.name)
      return res.status(400).json({ error: "Enter all the details" });

    await createProfile(projectInfo);

    return res.json({ message: "Profile created...", data: { projectInfo } });
  } catch (error) {
    console.error(error);
    return res
      .status(400)
      .json({ error: "Profile with the same name exists..." });
  }
});

router.put("/", async (req, res) => {
  try {
    const projectInfo: IProjectMetaData = req.body;
    if (!projectInfo.id || !projectInfo.name)
      return res.status(400).json({ error: "Invalid request" });

    await updateProfile(projectInfo);

    return res.json({ message: "Profile updated...", data: { projectInfo } });
  } catch (error) {
    return res.status(400).json({ error: "Something went wrong..." });
  }
});

router.get("/", async (req, res) => {
  try {
    const profiles = await listProfiles();

    return res.json({ message: "Success...", data: { profiles } });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ error: "Something went wrong..." });
  }
});

router.post("/info", async (req, res) => {
  try {
    if (!req.body.id) return res.status(400).json({ error: "Invalid request" });

    const profile = await getProfile(req.body.id);

    return res.json({ message: "Success...", data: { profile } });
  } catch (error) {
    return res.status(400).json({ error: "Something went wrong..." });
  }
});

router.post("/buildlog", async (req, res) => {
  try {
    if (!req.body.id) return res.status(400).json({ error: "Invalid request" });

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    const buildFilePath = `${process.env.APP_FILES_DIR}/${req.body.id}/build-log.txt`;

    // Function to send file contents
    const sendFileContents = () => {
      fs.readFile(buildFilePath, "utf8", (err, data) => {
        if (err) {
          console.error("Error reading file:", err);
          res.status(500).send("Internal Server Error");
        } else {
          res.write(`data: ${data.toString()}\n\n`);
        }
      });
    };

    sendFileContents();

    const watcher = fs.watch(buildFilePath, (eventType, filename) => {
      // If the file is modified, send new contents to the client
      if (eventType === "change") {
        sendFileContents();
      }
    });

    req.on("close", () => {
      watcher.close();
      res.end();
    });
  } catch (error) {
    return res.status(400).json({ error: "Something went wrong..." });
  }
});

export default router;
