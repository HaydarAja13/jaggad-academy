import { router } from '@inertiajs/react';
import Swal from 'sweetalert2';

export const confirmLogout = event => {
    event?.preventDefault();

    return Swal.fire({
        title: 'Keluar dari akun?',
        text: 'Sesi Anda akan diakhiri. Anda dapat masuk kembali kapan saja.',
        icon: 'warning',
        iconHtml: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 17l5-5-5-5M15 12H3M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/></svg>',
        showCancelButton: true,
        confirmButtonText: 'Keluar',
        cancelButtonText: 'Tetap di sini',
        buttonsStyling: false,
        reverseButtons: true,
        focusCancel: true,
        customClass: {
            container: 'jaggad-logout-container',
            popup: 'jaggad-logout-modal',
            icon: 'jaggad-logout-icon',
            title: 'jaggad-logout-title',
            htmlContainer: 'jaggad-logout-copy',
            actions: 'jaggad-logout-actions',
            confirmButton: 'jaggad-logout-confirm',
            cancelButton: 'jaggad-logout-cancel',
        },
    }).then(result => {
        if (result.isConfirmed) router.post(route('logout'));
        return result;
    });
};
