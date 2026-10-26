import { useMemo } from 'react';
import { prepareRichText } from '../Utils/richText';
import './RichText.css';

/**
 * Menampilkan konten deskripsi (HTML terbatas) dengan aman.
 *
 * - `inline` dipakai pada paragraf pendek/kartu: format inline tetap tampil,
 *   list diratakan supaya layout tidak rusak.
 * - Konten lama berbentuk teks biasa tetap didukung (newline menjadi <br>).
 */
export default function RichText({
    html,
    as: Tag = 'div',
    inline = false,
    className = '',
    fallback = null,
    ...rest
}) {
    const content = useMemo(() => prepareRichText(html, { inline }), [html, inline]);

    if (!content) return fallback;

    const classes = ['rich-text', inline ? 'rich-text--inline' : '', className]
        .filter(Boolean)
        .join(' ');

    return (
        <Tag
            {...rest}
            className={classes}
            dangerouslySetInnerHTML={{ __html: content }}
        />
    );
}
