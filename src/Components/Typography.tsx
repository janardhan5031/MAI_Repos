import React, { ReactNode } from "react";

interface TypographyProps {
  variant?: String;
  children: ReactNode;
  className?: String;
  onClick?: any;
  title?: string;
}

const Typography: React.FC<TypographyProps> = ({
  variant,
  children,
  className,
  onClick,
  title,
}) => {
  switch (variant) {
    case "h1":
      return (
        <span
          onClick={onClick}
          className={`font-extrabold lg:text-[2rem] md:text-2xl text-xl lg:leading-[2.625rem] ${className}`}
        >
          {children}
        </span>
      );
    case "h2":
      return (
        <span
          onClick={onClick}
          className={`font-semibold md:text-xl text-lg lg:text-2xl ${className}`}
        >
          {children}
        </span>
      );
    case "h3":
      return (
        <span
          onClick={onClick}
          className={`font-medium text-sm md:text-base lg:text-lg ${className}`}
        >
          {children}
        </span>
      );
    case "h4":
      return (
        <span
          onClick={onClick}
          className={`font-medium text-xs md:text-sm lg:text-base ${className}`}
        >
          {children}
        </span>
      );
    case "h5":
      return (
        <span
          onClick={onClick}
          className={`font-medium text-xs lg:text-sm ${className}`}
        >
          {children}
        </span>
      );
    case "h6":
      return (
        <span onClick={onClick} className={`font-normal text-xs ${className}`}>
          {children}
        </span>
      );
    case "card-condensed":
      return (
        <h3 className={`text-lg   text-graniteGray ${className}`}>
          {children}
        </h3>
      );
    case "card-condensed-yellow":
      return (
        <h3
          className={`text-base uppercase tracking-[3px] text-olive   ${className}`}
        >
          {children}
        </h3>
      );

    case "card-heading":
      return (
        <span className={`text-3xl font-semibold text-black ${className}`}>
          {children}
        </span>
      );

    case "button-text":
      return <span className={`text-lg   ${className}`}>{children}</span>;

    case "nav-item":
      return (
        <span
          className={`text-sm lg:text-base font-semibold whitespace-nowrap text-white uppercase cursor-pointer ${className}`}
        >
          {children}
        </span>
      );

    case "carousel-event-name":
      return (
        <span className={`text-sm font-bold text-white ${className}`}>
          {children}
        </span>
      );

    case "carousel-artist-name":
      return (
        <span className={`text-xl font-bold text-crayola ${className}`}>
          {children}
        </span>
      );

    case "drop-down":
      return (
        <span className={`text-sm font-semibold text-white ${className}`}>
          {children}
        </span>
      );

    case "condensed-email-placeholder":
      return (
        <span className={`text-2xl font-normal text-white   ${className}`}>
          {children}
        </span>
      );
    case "footer-text":
      return (
        <span className={`text-lg text-white ${className}`}>{children}</span>
      );

    case "events-text":
      return (
        <span
          className={`text-2xl uppercase tracking-[20px] text-crayola font-bold ${className}`}
        >
          {children}
        </span>
      );
    case "paragraph":
      return (
        <span className={`text-sm font-normal text-black ${className}`}>
          {children}
        </span>
      );

    case "Gradient-Heading":
      return (
        <span
          className={`text-8xl font-bold gradient-text-heading ${className}`}
        >
          {children}
        </span>
      );

    case "Discover-Gradient-Heading":
      return (
        <span
          className={`gradient-text xl:text-9xl text-6xl md:text-8xl font-extrabold ${className}`}
        >
          {children}
        </span>
      );

    case "Stay-In-Know-Gradient-Heading":
      return (
        <span className={`font-bold gradient-text ${className}`}>
          {children}
        </span>
      );

    case "Connect-Gradient-Heading":
      return (
        <span
          className={`leading-tight text-4xl sm:text-6xl font-bold gradient-text md:text-7xl lg:text-[120px] ${className}`}
        >
          {children}
        </span>
      );

    case "Discover-Regular-Gradient-Heading":
      return (
        <span
          className={`text-4xl xl:text-9xl sm:text-6xl md:text-7xl
        font-normal pb-4  gradient-text ${className}`}
        >
          {children}
        </span>
      );

    case "Condensed-Gradient-Heading":
      return (
        <span className={`text-9xl font-bold gradient-text ${className}`}>
          {children}
        </span>
      );

    case "Condensed-Heading":
      return (
        <span
          className={`text-[248px] text-[#FFD700] font-normal gradient-text ${className}`}
        >
          {children}
        </span>
      );
    case "Artist-Heading":
      return (
        <span className={`text-7xl text-[#fff] font-bold ${className}`}>
          {children}
        </span>
      );

    case "Artist-Name":
      return (
        <span className={`text-2xl text-[#fff] font-normal ${className}`}>
          {children}
        </span>
      );
    case "Artist-Description":
      return (
        <span className={`text-base text-[#fff] font-normal ${className}`}>
          {children}
        </span>
      );
    case "Event-Heading":
      return (
        <span className={`text-base text-[#fff] font-normal ${className}`}>
          {children}
        </span>
      );
    case "Event-Description":
      return (
        <span className={`text-base text-[#fff] font-normal ${className}`}>
          {children}
        </span>
      );
    case "Event-Gradient-Heading":
      return (
        <span className="gradient-text font-extrabold lg:!text-5xl md:!text-3xl text-2xl md:w-2/3 xl:w-3/5">
          {children}
        </span>
      );
    case "Settings-property":
      return (
        <span className="text-base text-black font-semibold ${className}">
          {children}
        </span>
      );

    case "Shopping-Card-Heading":
      return (
        <span className="text-xl font-normal leading-6 tracking-normal text-left">
          {children}
        </span>
      );
    case "FAQs-Heading":
      return (
        <span className="text-2xl font-bold leading-8 tracking-normal text-left">
          {children}
        </span>
      );
    case "FAQs-Accordion":
      return (
        <span className="text-sm font-normal leading-4 tracking-normal text-[#170F49]">
          {children}
        </span>
      );
    case "FAQs-Description":
      return (
        <span className="text-sm font-normal leading-5 tracking-normal text-[#6F6C90]">
          {children}
        </span>
      );
    case "FAQs-Search":
      return (
        <span className="text-sm font-semibold leading-4 tracking-normal text-[#B0B0B0]">
          {children}
        </span>
      );
    case "shoppingCart-Title":
      return (
        <span className="lg:text-4xl text-2xl font-bold leading-[54.47px] tracking-normal  text-[#000]">
          {children}
        </span>
      );
    case "shoppingCart-Product Title":
      return (
        <span className="md:text-lg text-sm font-normal leading-6  text-left tracking-normal text-[#000000]  ">
          {children}
        </span>
      );
    case "shoppingCart-Product Description":
      return (
        <span className="text-xs font-normal leading-4 tracking-normal flex-wrap text-left text-[#000000]">
          {children}
        </span>
      );
    case "shoppingCart-Product price":
      return (
        <span className="text-lg font-bold  leading-6 tracking-normal text-[#000000]">
          {children}
        </span>
      );
    case "shoppingCart-Inclusive all taxes":
      return (
        <span
          className={`text-xs font-semibold  leading-3 tracking-normal text-[#00B4B4] ${className}`}
        >
          {children}
        </span>
      );
    case "shoppingCart-Delete":
      return (
        <span className="text-xs font-semibold  leading-4 tracking-normal text-center text-[#F44336]">
          {children}
        </span>
      );
    case "shoppingCart-Description ":
      return (
        <span className="text-xs font-normal  leading-5 tracking-normal lg:text-center text-left text-[#747686]">
          {children}
        </span>
      );
    case "shoppingCart-Accordion":
      return (
        <span
          className={`text-lg font-semibold  leading-6 tracking-normal text-[#170F49] ${className}`}
        >
          {children}
        </span>
      );

    default:
      return (
        <span className={`${className}`} title={title}>
          {children}
        </span>
      );
  }
};

export default Typography;
