export default function Button ({url, text, color, hoverColor}: {url: string, text: string, color: string, hoverColor: string}) {
    const style = `text-base font-semibold rounded-lg px-4 py-2 hover:${hoverColor} ${color} w-full sm:w-fit`
    return (
        <a href={url}>
            <button className={style}>{text}</button>
        </a>
    )
}