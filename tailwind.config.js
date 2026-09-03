import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.{js,jsx,ts,tsx}',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Synonym', ...defaultTheme.fontFamily.sans],
                display: ['Chillax', 'Synonym', ...defaultTheme.fontFamily.sans],
            },
            fontSize: {
                xs: ['1rem', { lineHeight: '1.5rem' }],
                sm: ['1rem', { lineHeight: '1.5rem' }],
            },
        },
    },

    plugins: [forms],
};
