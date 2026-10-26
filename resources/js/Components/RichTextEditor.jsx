import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Bold, Italic, Link2, Link2Off, List, ListOrdered, RemoveFormatting, Underline,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
    normalizeRichText,
    prepareRichText,
    richTextLength,
    richTextToPlainText,
    sanitizeRichTextUrl,
} from '../Utils/richText';
import './RichTextEditor.css';

function ToolbarButton({ label, onClick, active = false, disabled = false, children }) {
    return (
        <button
            type="button"
            className={`rich-editor__button${active ? ' is-active' : ''}`}
            aria-label={label}
            aria-pressed={active}
            title={label}
            onMouseDown={event => event.preventDefault()}
            onClick={onClick}
            disabled={disabled}
        >
            {children}
        </button>
    );
}

/**
 * Editor teks kaya sederhana (tanpa dependensi eksternal).
 * Mendukung bold, italic, underline, bullet list, numbered list, dan tautan.
 *
 * Nilai yang dikirim ke `onChange` adalah HTML yang sudah disanitasi; nilai
 * kosong dikirim sebagai string kosong agar validasi `nullable` tetap berlaku.
 */
export default function RichTextEditor({
    value = '',
    onChange,
    id,
    label,
    placeholder = 'Tulis di sini…',
    hint,
    minHeight = 140,
    maxLength,
    disabled = false,
    className = '',
    ...rest
}) {
    const editorRef = useRef(null);
    const lastEmitted = useRef(null);
    const [isEmpty, setIsEmpty] = useState(true);
    const [count, setCount] = useState(0);
    const [active, setActive] = useState({
        bold: false,
        italic: false,
        underline: false,
        insertUnorderedList: false,
        insertOrderedList: false,
    });

    const measure = useCallback(candidate => {
        const text = richTextToPlainText(candidate);
        setCount(text.length);
        setIsEmpty(text.length === 0);
    }, []);

    // Sinkronkan nilai dari parent tanpa mengganggu posisi kursor saat mengetik.
    useEffect(() => {
        const editor = editorRef.current;
        if (!editor) return;

        const pending = prepareRichText(value);

        if (pending === lastEmitted.current) {
            measure(pending);
            return;
        }

        editor.innerHTML = pending;
        lastEmitted.current = pending;
        measure(pending);
    }, [value, measure]);

    useEffect(() => {
        try {
            document.execCommand('defaultParagraphSeparator', false, 'p');
            document.execCommand('styleWithCSS', false, false);
        } catch {
            // Browser lama: abaikan, format tetap memakai tag bawaan.
        }
    }, []);

    const refreshActive = useCallback(() => {
        const editor = editorRef.current;
        if (!editor || document.activeElement !== editor) return;

        try {
            setActive({
                bold: document.queryCommandState('bold'),
                italic: document.queryCommandState('italic'),
                underline: document.queryCommandState('underline'),
                insertUnorderedList: document.queryCommandState('insertUnorderedList'),
                insertOrderedList: document.queryCommandState('insertOrderedList'),
            });
        } catch {
            // queryCommandState tidak tersedia; biarkan status terakhir.
        }
    }, []);

    useEffect(() => {
        document.addEventListener('selectionchange', refreshActive);
        return () => document.removeEventListener('selectionchange', refreshActive);
    }, [refreshActive]);

    const emit = useCallback(() => {
        const editor = editorRef.current;
        if (!editor) return;

        const raw = editor.innerHTML;
        const text = richTextToPlainText(raw);

        // Teks tanpa tag diubah menjadi paragraf HTML agar tersimpan konsisten
        // dan karakter seperti `&` tidak ter-escape dua kali di server.
        const html = text ? normalizeRichText(raw) : '';

        lastEmitted.current = html;
        setCount(text.length);
        setIsEmpty(text.length === 0);
        onChange?.(html);
    }, [onChange]);

    const runCommand = useCallback(command => {
        if (disabled) return;
        editorRef.current?.focus();

        try {
            document.execCommand('styleWithCSS', false, false);
            document.execCommand(command, false, null);
        } catch {
            toast.error('Perintah format tidak didukung browser ini.');
            return;
        }

        emit();
        refreshActive();
    }, [disabled, emit, refreshActive]);

    const addLink = useCallback(() => {
        if (disabled) return;
        const editor = editorRef.current;
        if (!editor) return;

        editor.focus();
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) {
            toast.error('Pilih teks yang ingin dijadikan tautan terlebih dahulu.');
            return;
        }

        const input = window.prompt('Alamat tautan (contoh: https://contoh.com)', 'https://');
        if (input === null) return;

        const url = sanitizeRichTextUrl(input);
        if (!url) {
            toast.error('Alamat tautan tidak valid. Gunakan http, https, mailto, atau tel.');
            return;
        }

        document.execCommand('createLink', false, url);
        emit();
    }, [disabled, emit]);

    const clearFormatting = useCallback(() => {
        if (disabled) return;
        editorRef.current?.focus();
        document.execCommand('removeFormat', false, null);
        document.execCommand('unlink', false, null);
        emit();
        refreshActive();
    }, [disabled, emit, refreshActive]);

    const handleInput = () => {
        emit();
        refreshActive();
    };

    const handleBeforeInput = event => {
        if (!maxLength) return;
        if (event.inputType !== 'insertText' || typeof event.data !== 'string' || !event.data) return;

        const editor = editorRef.current;
        if (!editor) return;

        if (richTextLength(editor.innerHTML) + event.data.length > maxLength) {
            event.preventDefault();
        }
    };

    const handlePaste = event => {
        if (disabled) return;
        event.preventDefault();

        let text = event.clipboardData?.getData('text/plain') ?? '';
        if (!text) return;

        if (maxLength) {
            const remaining = Math.max(0, maxLength - richTextLength(editorRef.current?.innerHTML || ''));
            if (remaining === 0) {
                toast.error(`Maksimal ${maxLength} karakter.`);
                return;
            }
            text = text.slice(0, remaining);
        }

        document.execCommand('insertText', false, text);
        emit();
    };

    const handleDrop = event => {
        // Cegah gambar/HTML asing masuk ke konten.
        event.preventDefault();
    };

    const isOverLimit = Boolean(maxLength) && count > maxLength;

    return (
        <div className={`rich-editor${disabled ? ' is-disabled' : ''}${isOverLimit ? ' is-over-limit' : ''} ${className}`.trim()}>
            <div className="rich-editor__toolbar" role="toolbar" aria-label={label ? `Format ${label}` : 'Format teks'}>
                <ToolbarButton label="Tebal (Bold)" active={active.bold} onClick={() => runCommand('bold')} disabled={disabled}>
                    <Bold size={18} aria-hidden="true" />
                </ToolbarButton>
                <ToolbarButton label="Miring (Italic)" active={active.italic} onClick={() => runCommand('italic')} disabled={disabled}>
                    <Italic size={18} aria-hidden="true" />
                </ToolbarButton>
                <ToolbarButton label="Garis bawah (Underline)" active={active.underline} onClick={() => runCommand('underline')} disabled={disabled}>
                    <Underline size={18} aria-hidden="true" />
                </ToolbarButton>
                <span className="rich-editor__separator" aria-hidden="true" />
                <ToolbarButton label="Daftar poin" active={active.insertUnorderedList} onClick={() => runCommand('insertUnorderedList')} disabled={disabled}>
                    <List size={18} aria-hidden="true" />
                </ToolbarButton>
                <ToolbarButton label="Daftar bernomor" active={active.insertOrderedList} onClick={() => runCommand('insertOrderedList')} disabled={disabled}>
                    <ListOrdered size={18} aria-hidden="true" />
                </ToolbarButton>
                <span className="rich-editor__separator" aria-hidden="true" />
                <ToolbarButton label="Tambah tautan" onClick={addLink} disabled={disabled}>
                    <Link2 size={18} aria-hidden="true" />
                </ToolbarButton>
                <ToolbarButton label="Hapus tautan" onClick={() => runCommand('unlink')} disabled={disabled}>
                    <Link2Off size={18} aria-hidden="true" />
                </ToolbarButton>
                <ToolbarButton label="Hapus format" onClick={clearFormatting} disabled={disabled}>
                    <RemoveFormatting size={18} aria-hidden="true" />
                </ToolbarButton>
            </div>

            <div
                {...rest}
                ref={editorRef}
                id={id}
                className="rich-editor__area rich-text"
                contentEditable={!disabled}
                suppressContentEditableWarning
                role="textbox"
                aria-multiline="true"
                aria-label={label}
                aria-invalid={isOverLimit || undefined}
                data-placeholder={placeholder}
                data-empty={isEmpty ? 'true' : 'false'}
                style={{ minHeight }}
                onInput={handleInput}
                onBeforeInput={handleBeforeInput}
                onBlur={emit}
                onPaste={handlePaste}
                onDrop={handleDrop}
                onKeyUp={refreshActive}
                onMouseUp={refreshActive}
                onFocus={refreshActive}
            />

            {(hint || maxLength) && (
                <div className="rich-editor__footer">
                    {hint ? <span className="rich-editor__hint">{hint}</span> : <span />}
                    {maxLength ? (
                        <span className="rich-editor__count">
                            {count}/{maxLength}
                        </span>
                    ) : null}
                </div>
            )}
        </div>
    );
}
