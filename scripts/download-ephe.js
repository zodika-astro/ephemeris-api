const fs = require('fs');
const path = require('path');
const https = require('https');
const AdmZip = require('adm-zip');

const EPHE_DIR = path.join(__dirname, '..', 'ephe');
const EPHE_ZIP_URL = 'https://www.astro.com/ftp/swisseph/ephe/ephe.zip';

async function downloadAndExtractEphemeris() {
    if (fs.existsSync(EPHE_DIR) && fs.readdirSync(EPHE_DIR).length > 5) {
        console.log('Ephemeris directory already exists and is populated. Skipping download.');
        return;
    }

    console.log('Downloading ephemeris files for Railway deployment...');
    try {
        if (!fs.existsSync(EPHE_DIR)) {
            fs.mkdirSync(EPHE_DIR, { recursive: true });
        }

        const zipFilePath = path.join(EPHE_DIR, 'ephe.zip');
        const fileStream = fs.createWriteStream(zipFilePath);

        https.get(EPHE_ZIP_URL, (response) => {
            if (response.statusCode !== 200) {
                console.error(`Failed to download ephemeris zip. Status Code: ${response.statusCode}`);
                process.exit(1);
            }
            response.pipe(fileStream);
            fileStream.on('finish', () => {
                fileStream.close(() => {
                    console.log('Ephemeris zip downloaded.');
                    try {
                        const zip = new AdmZip(zipFilePath);
                        zip.extractAllTo(EPHE_DIR, /*overwrite*/ true);
                        console.log('Ephemeris files extracted.');

                        fs.unlinkSync(zipFilePath);
                        console.log('Temporary zip file removed.');
                        console.log('Chiron (and other bodies) should now work!');
                    } catch (zipErr) {
                        console.error('Error extracting ephemeris files:', zipErr.message);
                        process.exit(1);
                    }
                });
            });
        }).on('error', (err) => {
            console.error('Error during download:', err.message);
            process.exit(1);
        });

    } catch (err) {
        console.error('Error during ephemeris setup:', err.message);
        process.exit(1);
    }
}

downloadAndExtractEphemeris();
