struct FilePayload {
    1: string fileName;
    2: string relativePath;
    3: i64 fileSize;
    4: string md5_hash;
    5: binary fileData;
}

struct TransferResult {
    1: bool success;
    2: string message;
}

service FileService {
    void ping(),
    TransferResult importFile(1: FilePayload f)
    FilePayload exportFile(1: string relativePath)
}