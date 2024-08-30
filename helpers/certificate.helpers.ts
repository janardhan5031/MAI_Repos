const PDFDocument = require("pdfkit");
import * as fs from "fs";
const AWS = require("aws-sdk");
const qr = require("qrcode");
import "dotenv/config";
import loggerInstance from "../config/winston";
import { CertificateConstants } from "../constants/args.certificate";
import * as PDFKit from "pdfkit";
import * as https from "https";
import { AssetHelper } from "./asset.helpers";

export class CertificateHelper {
  //to create a pdf
  public static async createPdf(hashPresent: any, mintedData: any, user: any, assetHistory? : any) {
    try {
      let certName = hashPresent.asset.certifiate_owner_name
      
      const doc = new PDFDocument({
        font: "Times-Roman",
        size: "a4",
      });

      doc.userUnit = 2;

      if (!fs.existsSync("certificate")) {
        fs.mkdirSync("certificate");
      }

      const stream = fs.createWriteStream(
        `certificate/Myipr-certificate-${user.username}_${mintedData.txId.slice(
          -6
        )}.pdf`
      );
      doc.pipe(stream);

      doc.image("cert-bg.png", 0, 0, { height: 860, width: 600 });

      doc.image("myipr-logo.png", 230, 1, {
        height: 150,
        width: 150,
      });

      const fontPath = "fonts/Montserrat/Montserrat-Black.ttf";
      doc.registerFont("MontserratBlack", fontPath);

      loggerInstance.info('debug 1', certName)

      doc.fontSize(30).font("MontserratBlack").fillColor("#004C5E")
        .text(
          CertificateConstants.CERTIFICATE_TITLE,
          doc.page.width / 2 -
            doc.widthOfString(CertificateConstants.CERTIFICATE_TITLE) / 2,
          150
        );

      doc.fontSize(30).font("MontserratBlack").fillColor("#004C5E")
        .text(
          CertificateConstants.CERTIFICATE_TITLE_HEADER,
          doc.page.width / 2 -
            doc.widthOfString(CertificateConstants.CERTIFICATE_TITLE_HEADER) / 2,
          176
        );

      const fontMedium = "fonts/Montserrat/Montserrat-Medium.ttf";
      doc.registerFont("MontserratMedium", fontMedium);

      loggerInstance.info('debug 2')

      doc
        .fontSize(12)
        .font("MontserratMedium")
        .fillColor("#6D6E71")
        .text(
          CertificateConstants.CERTIFICATE_HEADER,
          doc.page.width / 2 -
            doc.widthOfString(CertificateConstants.CERTIFICATE_HEADER) / 2,
          215
        );

      const fontExtraBold = "fonts/Montserrat/Montserrat-ExtraBold.ttf";
      doc.registerFont("MontserratExtraBold", fontExtraBold);


      let lineHeight = 16
      let nextLineAt = 235

      doc
        .fontSize(13)
        .font("MontserratExtraBold")
        .fillColor("#093625")
        .text(  certName ,  (doc.page.width / 2) - (doc.widthOfString(certName)/ 2), nextLineAt);

      // const startX = 170;
      // const startY = 301;

      // // Set the ending point of the line
      // const endX = 415;
      // const endY = 301;

      // // Set line width and color
      // doc.lineWidth(2).strokeColor("black");

      // doc.moveTo(startX, startY);

      // // Draw a line to the ending point
      // doc.lineTo(endX, endY);

      // // Stroke (draw) the line
      // doc.stroke();


      nextLineAt += lineHeight + 6

      doc
        .fontSize(11)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text(
          CertificateConstants.RECOGNIZED_DESCRIPTION,
          doc.page.width / 2 -
            doc.widthOfString(CertificateConstants.RECOGNIZED_DESCRIPTION) / 2,
            nextLineAt
        );

      const isEnterprise = user?.type == "enterprise"  && user?.company?.certificate_creator_name == true 

      if(isEnterprise)  {
        nextLineAt += lineHeight
        const username = `${user.first_name} ${user.last_name}`
        doc
          .fontSize(10)
          .font("MontserratExtraBold")
          .fillColor("#093625")
          .text(
            `${user.id}`,
            doc.page.width / 2 -
              doc.widthOfString(
                `${user.id} ${CertificateConstants.COLLABORATION}`
              ) /
                2,
            nextLineAt
          )
          .fontSize(10)
          .font("MontserratMedium")
          .fillColor("#51494F")
          .text(
            `${CertificateConstants.COLLABORATION}`,
            doc.page.width / 2 -
              doc.widthOfString(
                `${user.id}${CertificateConstants.COLLABORATION}`
              ) /
                2 +
              doc.widthOfString(`${user.id}`),
            nextLineAt
          );

        nextLineAt += lineHeight

        doc
            .fontSize(10)
            .font("MontserratExtraBold")
            .fillColor("#093625")
            .text(
              `${username}`,
              doc.page.width / 2 -
                doc.widthOfString(`${username}`) / 2,
              nextLineAt
            );
        
      } else {
        doc
          .fontSize(11)
          .font("MontserratExtraBold")
          .fillColor("#093625")
          .text(
            `${user.id}`,
            doc.page.width / 2 - doc.widthOfString(`${user.id}`) / 2,
            nextLineAt += lineHeight
          );
        doc
          .fontSize(11)
          .font("MontserratMedium")
          .fillColor("#51494F")
          .text(
            `${CertificateConstants.USER_INFO}`,
            doc.page.width / 2 -
              doc.widthOfString(`${CertificateConstants.USER_INFO}`) / 2,
              nextLineAt += lineHeight
          );
      }

      doc
        .fontSize(11)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text(
          `${CertificateConstants.CERTIFICATE_PURPOSE}`,
          doc.page.width / 2 -
            doc.widthOfString(`${CertificateConstants.CERTIFICATE_PURPOSE}`) /
              2,
          nextLineAt += lineHeight
        );

      doc
        .fontSize(11)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text(
          `${CertificateConstants.POSSESSION_DESCRIPTION}`,
          doc.page.width / 2 -
            doc.widthOfString(
              `${CertificateConstants.POSSESSION_DESCRIPTION}`
            ) /
              2,
          nextLineAt += lineHeight
        );

      doc
        .fontSize(11)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text(
          `${CertificateConstants.CERTIFICATE_TIME}`,
          doc.page.width / 2 -
            doc.widthOfString(`${CertificateConstants.CERTIFICATE_TIME}`) / 2,
          nextLineAt += lineHeight
        );

      
      doc
        .fontSize(11)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text(
          `${CertificateConstants.FILE_NAME_LABEL}`,
          doc.page.width / 2 -
            doc.widthOfString(
              `${CertificateConstants.FILE_NAME_LABEL}`
            ) /
              2,
              nextLineAt += lineHeight
        )
        .font("MontserratExtraBold")
        .fillColor("#093625")
        .text(
          `${hashPresent.asset.version_name}`,
          doc.page.width / 2 -
            doc.widthOfString(
              `${hashPresent.asset.version_name}`
            ) /
              2,
            nextLineAt += lineHeight
        );

      nextLineAt += lineHeight
      doc
        .fontSize(11)
        .font("MontserratExtraBold")
        .fillColor("#093625")
        .text(
          `${CertificateConstants.SHA256_FINGERPRINT_LABEL}`,
          doc.page.width / 2 -
            doc.widthOfString(
              `${CertificateConstants.SHA256_FINGERPRINT_LABEL} ${CertificateConstants.SHA256_FINGERPRINT_LABEL_CONTI}`
            ) /
              2,
          nextLineAt
        )
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text(
          `${CertificateConstants.SHA256_FINGERPRINT_LABEL_CONTI}`,
          doc.page.width / 2 -
            doc.widthOfString(
              `${CertificateConstants.SHA256_FINGERPRINT_LABEL} ${CertificateConstants.SHA256_FINGERPRINT_LABEL_CONTI}`
            ) /
              2 +
            doc.widthOfString(
              `${CertificateConstants.SHA256_FINGERPRINT_LABEL}`
            ),
          nextLineAt
        );

      doc
        .fontSize(11)
        .font("MontserratExtraBold")
        .fillColor("#093625")
        .text(
          `${hashPresent.value}`,
          doc.page.width / 2 - doc.widthOfString(`${hashPresent.value}`) / 2,
          nextLineAt += lineHeight
        );

      doc
        .fontSize(11)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text(
          `${CertificateConstants.HASH_DETAILS}`,
          doc.page.width / 2 -
            doc.widthOfString(`${CertificateConstants.HASH_DETAILS}`) / 2,
          nextLineAt += lineHeight
        );

      doc
        .fontSize(11)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text(
          `${CertificateConstants.SUBMITTED}`,
          doc.page.width / 2 -
            doc.widthOfString(`${CertificateConstants.SUBMITTED}`) / 2,
          nextLineAt += lineHeight
        );

      doc
        .fontSize(11)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text(
          `${CertificateConstants.KALPTANTRA_LEDGER}`,
          doc.page.width / 2 -
            doc.widthOfString(`${CertificateConstants.KALPTANTRA_LEDGER}`) / 2,
          nextLineAt += lineHeight
        );

      doc
        .fontSize(11)
        .font("MontserratExtraBold")
        .fillColor("#093625")
        .text(
          `${mintedData.txId}`,
          doc.page.width / 2 - doc.widthOfString(`${mintedData.txId}`) / 2,
          nextLineAt += lineHeight
        );

      nextLineAt += 10
      
      if(!assetHistory || assetHistory.transactionData.length == 1) {
        doc
        .fontSize(11)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text(
          `${CertificateConstants.ISSUED_TIMESTAMP_LABEL}`,
          doc.page.width / 2 -
            doc.widthOfString(
              `${CertificateConstants.ISSUED_TIMESTAMP_LABEL}`
            ) /
              2,
          nextLineAt += lineHeight
        );

      nextLineAt += lineHeight

      doc
        .fontSize(11)
        .font("MontserratExtraBold")
        .fillColor("#093625")
        .text(
          `${mintedData.createdOn}`,
          doc.page.width / 2 -
            doc.widthOfString(
              `${mintedData.createdOn} ${CertificateConstants.WALLET_ADDRESS_LABEL}`
            ) /
              2,
          nextLineAt
        )
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text(
          `${CertificateConstants.WALLET_ADDRESS_LABEL}`,
          doc.page.width / 2 -
            doc.widthOfString(
              `${mintedData.createdOn} ${CertificateConstants.WALLET_ADDRESS_LABEL}`
            ) /
              2 +
            doc.widthOfString(`${mintedData.createdOn}`),
          nextLineAt
        );

      nextLineAt += lineHeight

      doc
        .fontSize(11)
        .font("MontserratExtraBold")
        .fillColor("#093625")
        .text(
          `${user.blockchainEnrolmentId}`,
          doc.page.width / 2 -
            doc.widthOfString(
              `${CertificateConstants.VERIFICATION_DESCRIPTION}${user.blockchainEnrolmentId}`
            ) /
              2,
              nextLineAt
        )
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text(
          `${CertificateConstants.VERIFICATION_DESCRIPTION}`,
          doc.page.width / 2 -
            doc.widthOfString(
              `${CertificateConstants.VERIFICATION_DESCRIPTION}${user.blockchainEnrolmentId}`
            ) /
              2 +
            doc.widthOfString(`${user.blockchainEnrolmentId}`),
            nextLineAt
        );
      } else if(assetHistory && assetHistory.transactionData.length > 1) {

        //  at the timestamp: 2023-08-03 19:18:33.099 +0000 UTC, to the registered wallet address: Avin_kothari@mailinator.com52.';

        let string = 'The digital proof certificate was first issued to'
        doc
        .fontSize(11)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text(
          `${string}`,
          doc.page.width / 2 - doc.widthOfString(`${string}`) / 2,
          nextLineAt += lineHeight
        );
        
        const firstWalletID = assetHistory.transactionData[assetHistory.transactionData.length - 1].Value.account[0];
        const firstCreatedOn = assetHistory.transactionData[assetHistory.transactionData.length - 1].Timestamp
        
        string = `MYIPR Wallet ID - ${firstWalletID}`
        doc
        .fontSize(11)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text(
          `${string}`,
          doc.page.width / 2 - doc.widthOfString(`${string}`) / 2,
          nextLineAt += lineHeight
        );

        string = `on ${firstCreatedOn} upon the presentation`
        doc
        .fontSize(11)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text(
          `${string}`,
          doc.page.width / 2 - doc.widthOfString(`${string}`) / 2,
          nextLineAt += lineHeight
        );

        string = `of the digital asset file. Subsequently, the ownership of the digital`
        doc
        .fontSize(11)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text(
          `${string}`,
          doc.page.width / 2 - doc.widthOfString(`${string}`) / 2,
          nextLineAt += lineHeight
        );

        string = `proof certificate was transferred to`
        doc
        .fontSize(11)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text(
          `${string}`,
          doc.page.width / 2 - doc.widthOfString(`${string}`) / 2,
          nextLineAt += lineHeight
        );

        string = `${user.first_name} ${user.last_name}`
        doc
        .fontSize(11)
        .font("MontserratExtraBold")
        .fillColor("#51494F")
        .text(
          `${string}`,
          doc.page.width / 2 - doc.widthOfString(`${string}`) / 2,
          nextLineAt += lineHeight
        );

        string = `at the timestamp ${mintedData.createdOn} to the`
        doc
        .fontSize(11)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text(
          `${string}`,
          doc.page.width / 2 - doc.widthOfString(`${string}`) / 2,
          nextLineAt += lineHeight
        );

        string = `registered wallet ${user.blockchainEnrolmentId}`
        doc
        .fontSize(11)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text(
          `${string}`,
          doc.page.width / 2 - doc.widthOfString(`${string}`) / 2,
          nextLineAt += lineHeight
        );

      }
      

      doc.image("myipr-stamp.png", 430, 650, {
        height: 110,
        width: 110,
      });



//update
      doc
      .fontSize(7.5)
      // .font("MontserratMedium")
      .fillColor("#51494F")
      .text(
        `${CertificateConstants.LINK}`,
        60,
        655
      );

      doc
      .fontSize(7.5)
      .font("MontserratExtraBold")
      .fillColor("#093625")
      .underline(334, 637, 17, 27, { color: '#0000FF' })
      .text(
        "link",
        334,
        655,
        {
          link:`${process.env.QR_CODE_URL}/${hashPresent.asset.version_id}`,
        },
       
      );

      await new Promise((resolve, reject) => {
        qr.toDataURL(
          `${process.env.QR_CODE_URL}/${hashPresent.asset.version_id}`,
          { color: { light: "00000000" } },
          (err, url) => {
            if (err) {
              loggerInstance.error("Unable to generate QR code", err);
              reject(err);
            } else {
              try {
                doc.image(Buffer.from(url.split(",")[1], "base64"), 53, 660, {
                  height: 100,
                  width: 100,
                });
                // Adjust the y-coordinate for the content
                const fontBold = "fonts/Montserrat/Montserrat-Bold.ttf";
                doc.registerFont("MontserratBold", fontExtraBold);
                doc
                  .fontSize(5.5)
                  .font("MontserratBold")
                  .fillColor("#51494F")
                  .text(
                    `${CertificateConstants.NOTE}`,
                    doc.page.width / 2 -
                      doc.widthOfString(`${CertificateConstants.NOTE}`) / 2,
                    758
                  );

                resolve("true");
              } catch (error) {
                loggerInstance.error(
                  "Error adding QR code to PDF document",
                  error
                );
                reject(error);
              }
            }
          }
        );
      });

      doc.addPage();

      doc.image("cert-bg-second.png", 0, 0, { height: 860, width: 600 });

      doc.image("myipr-logo.png", 230, 1, {
        height: 100,
        width: 100,
      });

      doc
        .fontSize(18)
        .font("MontserratExtraBold")
        .fillColor("#093625")
        .text(
          `${CertificateConstants.UNDERTAKE}`,
          doc.page.width / 2 -
            doc.widthOfString(`${CertificateConstants.UNDERTAKE}`) / 2,
          100
        );

      // Set line width and color
      doc.lineWidth(2).strokeColor("black");

      // Move to the starting point of the line
      doc.moveTo(130, 122);

      // Draw a line to the ending point
      doc.lineTo(470, 122);

      // Stroke (draw) the line
      doc.stroke();

      doc
        .fontSize(10)
        .font("MontserratBold")
        .fillColor("#093625")
        .text("I.", 18, 140)
        .fontSize(10)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text("     ", {
          continued: true,
        })
        .text(CertificateConstants.POINT_ONE_PART1, 27, 140);

      doc
        .fontSize(10)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text("     ", {
          continued: true,
        })
        .text(CertificateConstants.POINT_ONE_PART2, 27, 152);

      doc
        .fontSize(10)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text("     ", {
          continued: true,
        })
        .text(CertificateConstants.POINT_ONE_PART3, 27, 166);

      doc
        .fontSize(10)
        .font("MontserratExtraBold")
        .fillColor("#093625")
        .text("II.", 18, 190)
        .fontSize(10)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text("     ", {
          continued: true,
        })
        .text(CertificateConstants.POINT_TWO_PART1, 27, 190);

      doc
        .fontSize(10)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text("     ", {
          continued: true,
        })
        .text(CertificateConstants.POINT_TWO_PART2, 27, 203);

      doc
        .fontSize(10)
        .font("MontserratExtraBold")
        .fillColor("#093625")
        .text("III.", 18, 227)
        .fontSize(9.5)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text("     ", {
          continued: true,
        })
        .text(CertificateConstants.POINT_THREE_PART1, 27, 225);

      doc
        .fontSize(9.5)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text("     ", {
          continued: true,
        })
        .text(CertificateConstants.POINT_THREE_PART2, 27, 240);

      doc
        .fontSize(9.5)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text("     ", {
          continued: true,
        })
        .text(CertificateConstants.POINT_THREE_PART3, 27, 253);

      doc
        .fontSize(10)
        .font("MontserratExtraBold")
        .fillColor("#093625")
        .text("IV.", 18, 277)
        .fontSize(9.5)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text("     ", {
          continued: true,
        })
        .text(CertificateConstants.POINT_FOUR_PART1, 27, 275);

      doc
        .fontSize(9.5)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text("     ", {
          continued: true,
        })
        .text(CertificateConstants.POINT_FOUR_PART2, 27, 290);

      doc
        .fontSize(9.5)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text("     ", {
          continued: true,
        })
        .text(CertificateConstants.POINT_FOUR_PART3, 27, 303);

      doc
        .fontSize(9.5)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text("     ", {
          continued: true,
        })
        .text(CertificateConstants.POINT_FOUR_PART4, 27, 316);

      doc
        .fontSize(10)
        .font("MontserratExtraBold")
        .fillColor("#093625")
        .text("V.", 18, 340)
        .fontSize(9.5)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text("     ", {
          continued: true,
        })
        .text(CertificateConstants.POINT_FIVE_PART1, 27, 338);

      doc
        .fontSize(9.5)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text("     ", {
          continued: true,
        })
        .text(CertificateConstants.POINT_FIVE_PART2, 27, 353);

      doc
        .fontSize(10)
        .font("MontserratBold")
        .fillColor("#093625")
        .text("VI.", 18, 377)
        .fontSize(9.5)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text("     ", {
          continued: true,
        })
        .text(CertificateConstants.POINT_SIX_PART1, 27, 375);

      doc
        .fontSize(9.5)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text("     ", {
          continued: true,
        })
        .text(CertificateConstants.POINT_SIX_PART2, 27, 390);

      doc
        .fontSize(10)
        .font("MontserratBold")
        .fillColor("#093625")
        .text("VII.", 18, 412)
        .fontSize(9.5)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text("     ", {
          continued: true,
        })
        .text(CertificateConstants.POINT_SEVEN_PART1, 27, 412);

      doc
        .fontSize(9.5)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text("     ", {
          continued: true,
        })
        .text(CertificateConstants.POINT_SEVEN_PART2, 27, 425);

      doc
        .fontSize(10)
        .font("MontserratExtraBold")
        .fillColor("#093625")
        .text("VIII.", 18, 447)
        .fontSize(9.5)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text("     ", {
          continued: true,
        })
        .text(CertificateConstants.POINT_EIGHT, 27, 447);

      doc
        .fontSize(10)
        .font("MontserratExtraBold")
        .fillColor("#093625")
        .text("IX.", 18, 469)
        .fontSize(9.5)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text("     ", {
          continued: true,
        })
        .text(CertificateConstants.POINT_NINE, 27, 469);

      doc
        .fontSize(10)
        .font("MontserratExtraBold")
        .fillColor("#093625")
        .text("X.", 18, 491)
        .fontSize(9.5)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text("     ", {
          continued: true,
        })
        .text(CertificateConstants.POINT_TEN, 27, 491);

      doc
        .fontSize(10)
        .font("MontserratExtraBold")
        .fillColor("#093625")
        .text("XI.", 18, 513)
        .fontSize(9.5)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text("     ", {
          continued: true,
        })
        .text(CertificateConstants.POINT_ELEVEN_PART1, 27, 513);

      doc
        .fontSize(9.5)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text("     ", {
          continued: true,
        })
        .text(CertificateConstants.POINT_ELEVEN_PART2, 27, 526);

      doc
        .fontSize(10)
        .font("MontserratExtraBold")
        .fillColor("#093625")
        .text("XII.", 18, 548)
        .fontSize(9.5)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text("     ", {
          continued: true,
        })
        .text(CertificateConstants.POINT_TWELVE_PART1, 27, 548);

      doc
        .fontSize(9.5)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text("     ", {
          continued: true,
        })
        .text(CertificateConstants.POINT_TWELVE_PART2, 27, 561);

      doc
        .fontSize(9.5)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text("     ", {
          continued: true,
        })
        .text(CertificateConstants.POINT_TWELVE_PART3, 27, 574);

      doc
        .fontSize(10)
        .font("MontserratExtraBold")
        .fillColor("#093625")
        .text("XIII.", 18, 596)
        .fontSize(9.5)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text("     ", {
          continued: true,
        })
        .text(CertificateConstants.POINT_THIRTEEN_PART1, 27, 596);

      doc
        .fontSize(9.5)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text("     ", {
          continued: true,
        })
        .text(CertificateConstants.POINT_THIRTEEN_PART2, 27, 609);

      doc
        .fontSize(9.5)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text("     ", {
          continued: true,
        })
        .text(CertificateConstants.POINT_THIRTEEN_PART3, 27, 622);

      doc
        .fontSize(10)
        .font("MontserratExtraBold")
        .fillColor("#093625")
        .text("XIV.", 18, 644)
        .fontSize(9.5)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text("     ", {
          continued: true,
        })
        .text(CertificateConstants.POINT_FOURTEEN_PART1, 27, 644);

      doc
        .fontSize(9.5)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text("     ", {
          continued: true,
        })
        .text(CertificateConstants.POINT_FOURTEEN_PART2, 27, 657);

      doc
        .fontSize(9.5)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text("     ", {
          continued: true,
        })
        .text(CertificateConstants.POINT_FOURTEEN_PART3, 27, 670);

      doc
        .fontSize(10)
        .font("MontserratExtraBold")
        .fillColor("#093625")
        .text("XV.", 18, 692)
        .fontSize(9.5)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text("     ", {
          continued: true,
        })
        .text(CertificateConstants.POINT_FIFTEEN_PART1, 27, 692);

      doc
        .fontSize(9.5)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text("     ", {
          continued: true,
        })
        .text(CertificateConstants.POINT_FIFTEEN_PART2, 27, 703);

      doc
        .fontSize(9.5)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text("     ", {
          continued: true,
        })
        .text(CertificateConstants.POINT_FIFTEEN_PART3, 27, 715);

      // Set line width and color
      doc.lineWidth(2).strokeColor("black");

      // Move to the starting point of the line
      doc.moveTo(18, 738);

      // Draw a line to the ending point
      doc.lineTo(100, 738);

      // Stroke (draw) the line
      doc.stroke();

      doc
        .fontSize(6.5)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text(CertificateConstants.TREMS_AND_CONDITION_PART1, 20, 745);

      doc
        .fontSize(6.5)
        .font("MontserratMedium")
        .fillColor("#51494F")
        .text(CertificateConstants.TREMS_AND_CONDITION_PART2, 20, 753);

      doc.end();

      return new Promise((resolve, reject) => {
        stream.on("finish", async () => {
          loggerInstance.info("Generated Certificate Successfully");
          resolve(true);
        });
      });
    } catch (error) {
      loggerInstance.error("Error while generating the certificate", error);
      await AssetHelper.assetCreationError(hashPresent.asset.version_id, 101, "Error when generating the certificate file");
    }
  }
}
