/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  // content: [],
  theme: {
    extend: {
      screens: {
        xsm: { max: '430px' },
      },
      colors: {
        primary: '#7E14FF',
        secondary: '#A8A4A4',
        olive: '#8B7605',
        graniteGray: '#666666',
        crayola: '#FAE785',
        chineseBlack: '#0B1216',
        oliveBrown: '#AAA06B',
        lightGray: '#CCCCCC',
        lightSilver: '#E4E4E4',
        yellow: '#EFAD11',
        goldenYellow: '#F8E589',
        lightGrey: '#CACACA',
        greyText: '#747686',
        grayishColor: '#CED0DE',
        chineseBlack: '#0B1216',
        darkGray: '#202124',
        grayishBlue: '#4F525D',
        greyText: '#747686',
        grayishColor: '#CED0DE',
        chineseBlack: '#0B1216',
        darkGray: '#202124',
        grayishBlue: '#4F525D',
        steelGray: '#747686',
        goldenYellow: '#F8E589',
        saffron: '#E0A303',
      },
      height: {
        discover: '828px',
        discoverTitle: '232px',
      },
      lineHeight: {
        customLineHight: '6.875rem',
      },
      fontFamily: {
        // Define your font families and their class names
        sans: ['Open Sans', 'sans'],
      },
    },
  },
  plugins: [],
};
