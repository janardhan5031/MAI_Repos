import archiver from 'archiver';
import fs from 'fs';
import { GoogleDrive } from '../../external/google/google';
import { Dropbox } from '../../external/dropbox/dropbox';

const baseDir = '/app/downloads/'

export class ArchiveFile {
    private googledrive = new GoogleDrive()
    private dropbox = new Dropbox()

    public async archiveFile(userFileName: string, fileName: string, provider: string, accessToken: string) {
        try {
            // fileName = '1688984752929_odr_01C4KDWSUIJTA2LJJMCJGI7PBHKCNFUFL7.docx';
            // userFileName = 'my version'

            const archiveName = userFileName+'.myipr';
            const archivePath = baseDir+archiveName

            // Create a writable stream to save the archive
            const output = fs.createWriteStream(archivePath);
        
            // Create an instance of archiver
            const archive = archiver('zip', {
                zlib: { level: 9 } 
            });
        
            // Pipe the output stream to the archive
            archive.pipe(output);

            const filesToArchive = [
                baseDir+fileName,
            ];

            // Add files to the archive
            for (const file of filesToArchive) {
                const fileStream = fs.createReadStream(file);
                archive.append(fileStream, { name: fileName });
            }
        
            // Finalize the archive
            archive.finalize();
        
            output.on('close', () => {
                console.log("🚀 ~ file: archive-file.ts:42 ~ ArchiveFile ~ output.on ~ archiveName:", archiveName)
                switch (provider) {
                    case "google-drive": 
                        this.googledrive.uploadMyiprArchive(accessToken, archiveName, archivePath)
                    break;
                    case "dropbox":
                        this.dropbox.uploadMyiprArchive(accessToken, archiveName, archivePath)
                    break;
                    case "aws-s3": 

                    break;
                    case "onedrive": 

                    break;
                }
            });
    
            archive.on('error', (err) => {
                throw err
            });

            return archiveName;
        } catch (error) {
            throw error
        }
    }

}

