// downloadFile() function is from https://github.com/alanimdeo/NaverBlog-FileDownloader/blob/master/src/download.ts

import { mkdir, readdir } from "fs/promises";
import { createWriteStream } from "fs";
import https from "https";
import axios from "axios";

export interface NaverBlogDownloadInfo {
  encodedAttachFileName: string;
  encodedAttachFileNameByTruncate: string;
  encodedAttachFileUrl: string;
  licenseyn: string;
  maliciousCodeYn: "true" | "false";
  punishType: string;
  encodedAttachFileNameByUTF8: string;
  ahfLicenseYn: "true" | "false";
}

export interface DownloadInfo {
  fileName: string;
  url: string;
}

export async function downloadFile(url: string, path: string, filename: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    await readdir(path)
      .catch(async (err) => {
        if (err.code === "ENOENT") {
          return await mkdir(path, { recursive: true });
        } else {
          reject(err);
        }
      })
      .finally(async () => {
        const splitUrl = url.replace(/(http|https):\/\//, "").split("/");
        const host = splitUrl.shift();
        const pathname = "/" + splitUrl.join("/");
        https.get(
          {
            host,
            path: pathname,
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.41 Safari/537.36",
            },
          },
          (res) => {
            res.on("error", (err) => {
              return reject(err);
            });
            const file = createWriteStream((path.endsWith("/") ? path : path + "/") + filename);
            res.pipe(file);
            res.on("end", () => {
              file.close();
              return resolve();
            });
            file.on("error", (err) => {
              file.close();
              return reject(err);
            });
          }
        );
      });
  });
}

export async function getDownloads(blogId: string, logNo: string): Promise<DownloadInfo[]> {
  const url = `https://blog.naver.com/PostView.naver?blogId=${blogId}&logNo=${logNo}`;
  const response = await axios.get(url);
  const files: NaverBlogDownloadInfo[] = JSON.parse(
    response.data.split("aPostFiles[1] = JSON.parse('")[1].split("'.replace(/\\\\'/g, ''));")[0]
  );
  return files.map((file) => {
    return {
      fileName: file.encodedAttachFileName,
      url: file.encodedAttachFileUrl,
    };
  });
}
