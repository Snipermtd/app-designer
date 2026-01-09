namespace java com.example.androidthriftserver

struct Message {
    1: string text
}

//Implement SHA-256/MD-5 hashing
struct File {
    1: string fileName,
    2: i64 fileSize,
    3: string md5_hash,
    4: binary fileData
}

service FileService {
    void ping(),

    string upload(1: File f)
}