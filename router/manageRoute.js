const express = require("express");
const { checkMongoDB, importMongoDB, getAllDatabase, getAllBackupFolderList, deleteDatabase } = require("../controller/manageController");
const router = express.Router();

router.get("/check/:dbName", checkMongoDB);
router.get("/import/:folderName/:dbName", importMongoDB)
router.get("/db", getAllDatabase)
router.get("/folder", getAllBackupFolderList)
router.get("/deleteDB/:dbName", deleteDatabase)



module.exports = router