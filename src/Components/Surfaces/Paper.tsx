import React from 'react';

const Paper = (props: any) => {
  switch (props.variant) {
    case 'no-padding':
      return (
        <div className="h-full">
          <div
            className={`${props.className} p-1 h-full drop-shadow-xl bg-white rounded-xl`}
          >
            {props.children}
          </div>
        </div>
      );
      break;
    case 'no-padding-w-full':
      return (
        <div className="w-full h-full">
          <div
            className={`${props.className} p-1 h-full drop-shadow-xl bg-white rounded-xl`}
          >
            {props.children}
          </div>
        </div>
      );
      break;
    default:
      return (
        <div
          className={`${props.className} p-5 md:p-10 bg-white min-w-max drop-shadow-none md:drop-shadow-xl rounded-xl`}
        >
          {props.children}
        </div>
      );
      break;
  }
};

export default Paper;
