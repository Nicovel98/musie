/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        // orientation landscape + height <= 640px and width <= 1024px
        'landscape-compact': {'raw': '(orientation: landscape) and (max-height: 640px) and (max-width: 1024px)'},
        // orientation landscape + height md (<= 767px)
        'landscape-h-md': {'raw': '(orientation: landscape) and (max-height: 767px)'},
        // orientation landscape + width lg (<= 1023px)
        'landscape-w-lg': {'raw': '(orientation: landscape) and (max-width: 1023px)'},
        // altura sm y para abajo (max-height: 639px)
        'h-sm': {'raw': '(max-height: 639px)'},
        // combinación: ancho >= lg (min-width: 1024px) y altura <= sm (max-height: 639px)
        'lg-h-sm': {'raw': '(min-width: 1024px) and (max-height: 639px)'},
      },
    },
  },
  plugins: [],
};
