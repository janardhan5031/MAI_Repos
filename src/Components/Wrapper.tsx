import { ReactNode, useEffect } from "react";
import landingHero_Background from "../assets/landingHero_Background.png";
import Typography from "../Components/Typography";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Icons from "./Icons";
import Paper from "./Surfaces/Paper";

interface WrapperProps {
  children: ReactNode;
  header?: any;
  description?: any;
}

const Wrapper: React.FC<WrapperProps> = ({ children, header, description }) => {
  const { t } = useTranslation();

  const location = useLocation();
  useEffect(() => {
    window.addEventListener("beforeunload", () => {
      window.scrollTo(0, 0);
    });
  }, []);
  return (
    <div className="flex justify-center w-full">
      <div className="relative w-full h-full place-content-center">
        <div className="absolute left-0 w-full ">
          <div className="flex items-center justify-center max-w-[1512px] w-full mx-auto">
            <div className="flex flex-row items-center justify-between w-full h-screen gap-3 md:px-10 lg:px-20 lg:gap-5">
              <div className="flex-col hidden md:flex">
                <Typography
                  variant="events-text"
                  className="px-1 text-base md:text-lg lg:text-2xl"
                >
                  {t("Immersive")}
                </Typography>
                <Typography
                  variant="Discover-Gradient-Heading"
                  className="lg:!text-5xl 2xl:!text-7xl !text-3xl"
                >
                  {t("Entertainment")}
                </Typography>

                <Typography
                  variant="Discover-Regular-Gradient-Heading"
                  className="!text-3xl lg:!text-5xl 2xl:!text-7xl"
                >
                  {t("begins here")}
                </Typography>
                <div className="flex flex-row items-center gap-3 px-1">
                  <div className="bg-[#6705DC] w-16 lg:w-24 h-14 lg:h-16 text-center text-white text-4xl py-2.5 lg:py-2.5 xl:py-4">
                    :)
                  </div>
                  <Typography className="!text-lg lg:text-3xl !font-light text-white">
                    {t("Step into the event")}
                  </Typography>
                  <Icons variant="colored-arrow" />
                </div>
              </div>
              <Paper
                className={`md:max-w-[400px] max-h-[620px] py-5 px-14 lg:max-w-[485px] lg:min-w-[485px] md:mr-1 w-full`}
              >
                <div className="flex flex-col gap-4 px-1">
                  {header && (
                    <Typography
                      variant=""
                      className="text-2xl font-semibold text-black"
                    >
                      {header}
                    </Typography>
                  )}
                  <Typography
                    className={`max-w-[330px] font-normal text-black opacity-[40%] text-xs`}
                  >
                    {description}
                  </Typography>
                </div>
                {children}
              </Paper>
            </div>
          </div>
        </div>
        <div className="relative hidden h-screen -z-10 md:block">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${landingHero_Background})`,
              backgroundRepeat: "no-repeat",
              backgroundSize: "cover",
            }}
          ></div>
          <div className="absolute inset-0 black-radial-gradient"></div>
        </div>
      </div>
    </div>
  );
};

export default Wrapper;
