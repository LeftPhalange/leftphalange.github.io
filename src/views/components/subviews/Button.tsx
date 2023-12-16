export default function Button ({url, text, color}: {url: string, text: string, color: string}) {
    const style = `text-base font-semibold rounded-lg px-4 py-2 ${color} w-full sm:w-fit`
    return (
        <a href={url}>
            <button className={style}>{text}</button>
        </a>
    )
}