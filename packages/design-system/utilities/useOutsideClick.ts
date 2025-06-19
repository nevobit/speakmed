import { useEffect, useRef } from "react";

interface Props {
    handler: () => void;
    listenCapturing?: boolean
}

export const useOutsideClick = ({ handler, listenCapturing = true }: Props) => {
    const ref = useRef<HTMLElement | null>(null);

    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                handler();
            }
        };

        document.addEventListener('click', handleClick, listenCapturing)

        return () => document.removeEventListener('click', handleClick, listenCapturing);
    }, [handler, listenCapturing]);
    return ref;
}