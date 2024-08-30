import * as fs from "fs";
import { MailService } from "../service/mail.service";
import loggerInstance from "../config/winston";

export class MailHelper {
  //to senf the certifiacte to mail
  public static async sendCertificateThroughMail(
    req,
    transactionId,
    hashPresent
  ) {
    try {
      let user = req.user.result;
      let staff = false;
      if (user.type == "enterprise") {
        if (user.business_level == "staff") {
          staff = true;
        }
      }
      const file = fs.readFileSync(
        `certificate/Myipr-certificate-${user.username}_${transactionId.slice(
          -6
        )}.pdf`
      );

      const subject = "Certificate generated";
      const message = `<!DOCTYPE html>
      <html>
      
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="ie=edge">
          <title>MyIPR</title>
      </head>
      
      <body bgcolor="#f7f7f7" style="margin: 0px; padding:10px 0x; background: #ffffff; font-family: 'Karla', sans-serif;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #fff;">
            <tr>
                <td align="center">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%"
                        style="max-width: 600px; background: white;">
                        <tr>
                            <td
                                style="background: #fff; padding: 0px 0px; max-width: 600px;border: 1px solid black; border-bottom: none;">
                                <a href="https://myipr.io" target="_blank" style="display:block;">
                                    <img src="https://dev-p2enft-images.s3.ap-south-1.amazonaws.com/302e323435383136303439393037313933331687330855885.png"
                                        alt="MyIPR" width="598" height="70" />
                                </a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
              <tr>
                  <td align="center">
                      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; ">
                          <tr>
                              <td
                                  style="background:#fff; padding: 20px 20px 25px;border: 1px solid black; border-bottom: none; border-top: none;">
                                  <p
                                      style="padding:0px; margin:0px; font-weight:normal; line-height: 18px; color: #7b7b7b; font-size: 15px;">
                                      Dear ${user.username},
                                  </p>
                              </td>
                          </tr>
                          <tr>
                              <td
                                  style="background:#fff; padding: 20px 20px 25px;border: 1px solid black; border-bottom: none; border-top: none;">
                                  <p
                                      style="padding:0px; margin:0px; font-weight:normal; line-height: 18px; color: #7b7b7b; font-size: 15px;">
                                      Your certificate ${hashPresent.asset.version_name} has been successfully generated. 
                                      <br /> <br />
                                      <br />
                                      Congratulations! Your creation is secured now.
                                      Simply login to your account and navigate to the My Collection section to access your certificate.
                                  </p>
                              </td>
                          </tr>
                          <tr>
                              <td
                                  style="background:#fff; padding: 10px 20px 40px;border: 1px solid black; border-bottom: none; border-top:none;">
                                  <p
                                      style="padding:0px; margin:0px; font-weight:normal; line-height: 18px; color: #7b7b7b; font-size: 15px;">
                                      Best
                                      regards, <br /> MyIPR
                                  </p>
                              </td>
                          </tr>
                      </table>
                  </td>
              </tr>
              <tr>
                  <td align="center">
                      <table border="0" cellpadding="0" cellspacing="0" width="100%"
                          style="max-width: 600px; min-height:100px; background:#E3F0F0;border: 1px solid black; border-top: none;">
                          <tr>
                              <th align="left" style="background:transparent; padding:10px 0px 10px 20px; height: 50px;">
                                  <p
                                      style="padding:0px; margin:0px; font-weight:normal;  font-size: 8px; line-height: 9px;  color: #7b7b7b;">
                                      <b style="color: #054F61; font-size: 11px; line-height: 20px;">Mai Labs Pvt. Ltd.</b>
                                      <br />
                                      Sec-16A, 7th-Floor,
                                      <br />
                                      Film City Noida
                                      <br />
                                      <a style="line-height: 10px;" href="mailto:care@myipr.io">care@myipr.io</a>
                                  </p>
                              </th>
                              <th align="center" style="background:transparent; padding:0px 110px 10px 0px; height: 50px;">
                                  <p
                                      style="padding:0px; margin:0px; font-weight:normal;  font-size: 8px; line-height: 18px;  color: #7b7b7b;">
                                      
                                      &copy; 2023 <a style="line-height: 10px;" href="https://myipr.io">myipr.io</a> | <a style="line-height: 10px;" href="https://myipr.io/privacypolicy">Privacy Policy</a>
                                  </p>
                              </th>
                          </tr>
                      </table>
                  </td>
              </tr>
          </table>
      </body>
      
      </html>`;

      if (staff) {
        const adminMessage = `<!DOCTYPE html>
        <html>
        
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="X-UA-Compatible" content="ie=edge">
            <title>MyIPR</title>
        </head>
        
        <body bgcolor="#f7f7f7" style="margin: 0px; padding:10px 0x; background: #ffffff; font-family: 'Karla', sans-serif;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #fff;">
                <tr>
                    <td align="center">
                        <table border="0" cellpadding="0" cellspacing="0" width="100%"
                            style="max-width: 600px; background: white;">
                            <tr>
                                <td
                                    style="background: #fff; padding: 0px 0px; max-width: 600px;border: 1px solid black; border-bottom: none;">
                                    <a href="https://myipr.io" target="_blank" style="display:block;">
                                        <img src="https://dev-p2enft-images.s3.ap-south-1.amazonaws.com/302e323435383136303439393037313933331687330855885.png"
                                            alt="MyIPR" width="598" height="70" />
                                    </a>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td align="center">
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; ">
                            <tr>
                                <td
                                    style="background:#fff; padding: 20px 20px 25px;border: 1px solid black; border-bottom: none; border-top: none;">
                                    <p
                                        style="padding:0px; margin:0px; font-weight:normal; line-height: 18px; color: #7b7b7b; font-size: 15px;">
                                        Dear ${user.parent.first_name},
                                    </p>
                                </td>
                            </tr>
                            <tr>
                                <td
                                    style="background:#fff; padding: 20px 20px 25px;border: 1px solid black; border-bottom: none; border-top: none;">
                                    <p
                                        style="padding:0px; margin:0px; font-weight:normal; line-height: 18px; color: #7b7b7b; font-size: 15px;">
                                        ${user.username} has generated a certificate ${hashPresent.asset.version_name} successfully
                                        <br /> <br />
  
                                    </p>
                                </td>
                            </tr>
                            <tr>
                                <td
                                    style="background:#fff; padding: 10px 20px 40px;border: 1px solid black; border-bottom: none; border-top:none;">
                                    <p
                                        style="padding:0px; margin:0px; font-weight:normal; line-height: 18px; color: #7b7b7b; font-size: 15px;">
                                        Best
                                        regards, <br /> MyIPR
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td align="center">
                        <table border="0" cellpadding="0" cellspacing="0" width="100%"
                            style="max-width: 600px; min-height:100px; background:#E3F0F0;border: 1px solid black; border-top: none;">
                            <tr>
                                <th align="left" style="background:transparent; padding:10px 0px 10px 20px; height: 50px;">
                                    <p
                                        style="padding:0px; margin:0px; font-weight:normal;  font-size: 8px; line-height: 9px;  color: #7b7b7b;">
                                        <b style="color: #054F61; font-size: 11px; line-height: 20px;">Mai Labs Pvt. Ltd.</b>
                                        <br />
                                        Sec-16A, 7th-Floor,
                                        <br />
                                        Film City Noida
                                        <br />
                                        <a style="line-height: 10px;" href="mailto:care@myipr.io">care@myipr.io</a>
                                    </p>
                                </th>
                                <th align="center" style="background:transparent; padding:0px 110px 10px 0px; height: 50px;">
                                    <p
                                        style="padding:0px; margin:0px; font-weight:normal;  font-size: 8px; line-height: 18px;  color: #7b7b7b;">
                                        
                                        &copy; 2023 <a style="line-height: 10px;" href="https://myipr.io">myipr.io</a> | <a style="line-height: 10px;" href="https://myipr.io/privacypolicy">Privacy Policy</a>
                                    </p>
                                </th>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        
        </html>`;
        await MailService.sendEmail(
          user.parent.email,
          subject,
          adminMessage,
          "Asset Creation",
          "Asset_related",
          {
            file,
            name: `Myipr-certificate-${user.username}_${transactionId.slice(
              -6
            )}.pdf`,
          }
        );
        loggerInstance.info("Sent the certificate to the mail of Admin")
      }

      loggerInstance.info("Sent the certificate to the mail");
      return await MailService.sendEmail(
        user,
        subject,
        message,
        "Asset Creation",
        "Asset_related",
        {
          file,
          name: `Myipr-certificate-${user.username}_${transactionId.slice(
            -6
          )}.pdf`,
        }
      );
    } catch (error) {
      loggerInstance.error(
        "Error while sending the certifiacte to mail",
        error
      );
      throw error;
    }
  }

  public static async sendBurnCertificateThroughMail(req, assetName) {
    try {
      let user = req?.user?.result;

       let staff = false;
      if (user.type == "enterprise") {
        if (user.business_level == "staff") {
          staff = true;
        }
      }

      const subject = "Certificate Burned";
      const message = `<!DOCTYPE html>
      <html>
      
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="ie=edge">
          <title>MyIPR</title>
      </head>
      
      <body bgcolor="#f7f7f7" style="margin: 0px; padding:10px 0x; background: #ffffff; font-family: 'Karla', sans-serif;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #fff;">
          <tr>
          <td align="center">
              <table border="0" cellpadding="0" cellspacing="0" width="100%"
                  style="max-width: 600px; background: white;">
                  <tr>
                      <td
                          style="background: #fff; padding: 0px 0px; max-width: 600px;border: 1px solid black; border-bottom: none;">
                          <a href="https://myipr.io" target="_blank" style="display:block;">
                              <img src="https://dev-p2enft-images.s3.ap-south-1.amazonaws.com/302e323435383136303439393037313933331687330855885.png"
                                  alt="MyIPR" width="598" height="70" />
                          </a>
                      </td>
                  </tr>
              </table>
          </td>
      </tr>
              <tr>
                  <td align="center">
                      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; ">
                          <tr>
                              <td
                                  style="background:#fff; padding: 20px 20px 25px;border: 1px solid black; border-bottom: none; border-top: none;">
                                  <p
                                      style="padding:0px; margin:0px; font-weight:normal; line-height: 18px; color: #7b7b7b; font-size: 15px;">
                                      Dear ${user.username},
                                  </p>
                              </td>
                          </tr>
                          <tr>
                              <td
                                  style="background:#fff; padding: 20px 20px 25px;border: 1px solid black; border-bottom: none; border-top: none;">
                                  <p
                                      style="padding:0px; margin:0px; font-weight:normal; line-height: 18px; color: #7b7b7b; font-size: 15px;">
                                      This email confirms that you have successfully burned your ${assetName} certificate.
                                      <br /> <br />
                                      <br />
                                      The certificate is no longer associated with your account and will no longer be valid for authentication or related purposes.
                                  </p>
                              </td>
                          </tr>
                          <tr>
                              <td
                                  style="background:#fff; padding: 10px 20px 40px;border: 1px solid black; border-bottom: none; border-top:none;">
                                  <p
                                      style="padding:0px; margin:0px; font-weight:normal; line-height: 18px; color: #7b7b7b; font-size: 15px;">
                                      Best
                                      regards, <br /> MyIPR
                                  </p>
                              </td>
                          </tr>
                      </table>
                  </td>
              </tr>
              <tr>
                  <td align="center">
                      <table border="0" cellpadding="0" cellspacing="0" width="100%"
                          style="max-width: 600px; min-height:100px; background:#E3F0F0;border: 1px solid black; border-top: none;">
                          <tr>
                              <th align="left" style="background:transparent; padding:10px 0px 10px 20px; height: 50px;">
                                  <p
                                      style="padding:0px; margin:0px; font-weight:normal;  font-size: 8px; line-height: 9px;  color: #7b7b7b;">
                                      <b style="color: #054F61; font-size: 11px; line-height: 20px;">Mai Labs Pvt. Ltd.</b>
                                      <br />
                                      Sec-16A, 7th-Floor,
                                      <br />
                                      Film City Noida
                                      <br />
                                      <a style="line-height: 10px;" href="mailto:care@myipr.io">care@myipr.io</a>
                                  </p>
                              </th>
                              <th align="center" style="background:transparent; padding:0px 110px 10px 0px; height: 50px;">
                                  <p
                                      style="padding:0px; margin:0px; font-weight:normal;  font-size: 8px; line-height: 18px;  color: #7b7b7b;">
                                      
                                      &copy; 2023 <a style="line-height: 10px;" href="https://myipr.io">myipr.io</a> | <a style="line-height: 10px;" href="https://myipr.io/privacypolicy">Privacy Policy</a>
                                  </p>
                              </th>
                          </tr>
                      </table>
                  </td>
              </tr>
          </table>
      </body>
      
      </html>`;

      if(staff){
        const adminMessage = `<!DOCTYPE html>
      <html>
      
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="ie=edge">
          <title>MyIPR</title>
      </head>
      
      <body bgcolor="#f7f7f7" style="margin: 0px; padding:10px 0x; background: #ffffff; font-family: 'Karla', sans-serif;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #fff;">
            <tr>
                <td align="center">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%"
                        style="max-width: 600px; background: white;">
                        <tr>
                            <td
                                style="background: #fff; padding: 0px 0px; max-width: 600px;border: 1px solid black; border-bottom: none;">
                                <a href="https://myipr.io" target="_blank" style="display:block;">
                                    <img src="https://dev-p2enft-images.s3.ap-south-1.amazonaws.com/302e323435383136303439393037313933331687330855885.png"
                                        alt="MyIPR" width="598" height="70" />
                                </a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
              <tr>
                  <td align="center">
                      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; ">
                          <tr>
                              <td
                                  style="background:#fff; padding: 20px 20px 25px;border: 1px solid black; border-bottom: none; border-top: none;">
                                  <p
                                      style="padding:0px; margin:0px; font-weight:normal; line-height: 18px; color: #7b7b7b; font-size: 15px;">
                                      Dear ${user.parent.first_name},
                                  </p>
                              </td>
                          </tr>
                          <tr>
                              <td
                                  style="background:#fff; padding: 20px 20px 25px;border: 1px solid black; border-bottom: none; border-top: none;">
                                  <p
                                      style="padding:0px; margin:0px; font-weight:normal; line-height: 18px; color: #7b7b7b; font-size: 15px;">
                                      This email confirms that you have successfully burned ${assetName} certificate (burned by ${user.username}.
                                      <br /> <br />
                                      <br />
                                      The certificate is no longer associated with your account and will no longer be valid for authentication or related purposes.
                                  </p>
                              </td>
                          </tr>
                          <tr>
                              <td
                                  style="background:#fff; padding: 10px 20px 40px;border: 1px solid black; border-bottom: none; border-top:none;">
                                  <p
                                      style="padding:0px; margin:0px; font-weight:normal; line-height: 18px; color: #7b7b7b; font-size: 15px;">
                                      Best
                                      regards, <br /> MyIPR
                                  </p>
                              </td>
                          </tr>
                      </table>
                  </td>
              </tr>
              <tr>
                  <td align="center">
                      <table border="0" cellpadding="0" cellspacing="0" width="100%"
                          style="max-width: 600px; min-height:100px; background:#E3F0F0;border: 1px solid black; border-top: none;">
                          <tr>
                              <th align="left" style="background:transparent; padding:10px 0px 10px 20px; height: 50px;">
                                  <p
                                      style="padding:0px; margin:0px; font-weight:normal;  font-size: 8px; line-height: 9px;  color: #7b7b7b;">
                                      <b style="color: #054F61; font-size: 11px; line-height: 20px;">Mai Labs Pvt. Ltd.</b>
                                      <br />
                                      Sec-16A, 7th-Floor,
                                      <br />
                                      Film City Noida
                                      <br />
                                      <a style="line-height: 10px;" href="mailto:care@myipr.io">care@myipr.io</a>
                                  </p>
                              </th>
                              <th align="center" style="background:transparent; padding:0px 110px 10px 0px; height: 50px;">
                                  <p
                                      style="padding:0px; margin:0px; font-weight:normal;  font-size: 8px; line-height: 18px;  color: #7b7b7b;">
                                      
                                      &copy; 2023 <a style="line-height: 10px;" href="https://myipr.io">myipr.io</a> | <a style="line-height: 10px;" href="https://myipr.io/privacypolicy">Privacy Policy</a>
                                  </p>
                              </th>
                          </tr>
                      </table>
                  </td>
              </tr>
          </table>
      </body>
      
      </html>`;
      await MailService.sendEmail(
        user.parent.email,
        subject,
        adminMessage,
        "Asset Creation",
        "Asset_related",
        null
      );
      loggerInstance.info("Mail sent to admin");
      }

      loggerInstance.info("Mail sent");
      return await MailService.sendEmail(
        user,
        subject,
        message,
        "Asset Creation",
        "Asset_related",
        null
      );
    } catch (error) {
      loggerInstance.error(
        "Error while sending the certifiacte to mail",
        error
      );
      throw error;
    }
  }
}
