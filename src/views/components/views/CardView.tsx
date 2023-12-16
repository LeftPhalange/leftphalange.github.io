import './CardView.css';
import Component from '../types/Component';

function renderItems(sourceObj: any, key: string) {
    if (key == "accomplishments") {
        const accomplishments: string[] = sourceObj["accomplishments"];
        return (
            <ul key={key} className="space-y-2">
                {accomplishments.map((item: string, index: number) => (<li key={index.toString()} className="text-sm font-light list-disc">{item}</li>))}
            </ul>
        );
    } else if (key == "technologies") {
        const technologies: any[] = sourceObj["technologies"];
        return (
            <div key={key} className="flex flex-row align-middle">
                {technologies.map((item: any, index: number) => (
                    <a key={index.toString()} href={item["url"]}>
                        <img src={item["imageUrl"]} alt={item["altText"]} width="75%" height="75%" />
                    </a>
                ))}
            </div>
        )
    } else {
        return (<></>)
    };
}

function returnLink(subheading: any) {
    const isLink = subheading["type"] == "link";
    return (
        isLink ?
            (<a href={subheading["url"]}><span className="font-semibold">{subheading["displayText"]}</span></a>) :
            (<span className="font-semibold">{subheading["displayText"]}</span>)
    );
}

function processComponent(type: string, contents: any) {
    if (type == "heading") {
        return (
            <div className="flex-1 flex-row">
                <div className="flex flex-row space-x-4 items-center">
                    <img src={contents["logo"]} className="w-12 h-12" />
                    <div className="flex flex-col max-w-full">
                        <span className="text-xl font-semibold w-fit">{contents["name"]}</span>
                        <span className="text-base">
                            {returnLink(contents.subheading)} • 🗓️ {contents.dates.join(" - ")}
                        </span>
                    </div>
                </div>
            </div>
        );
    } else if (type == "body") {
        return (
            <div>
                {Object.keys(contents).map((key) => (
                    <>
                        <span key={key} className="text-xs text-gray-300 font-bold">{key.toUpperCase()}</span>
                        {renderItems(contents, key)}
                    </>
                ))}
            </div>
        );
    }
    return (<></>);
}

function CardView({ title, components }: { title: string, components: Component[] }) {
    return (
        <div className="flex flex-col space-y-2">
            { title != "" ? (<span className="text-2xl font-bold">{title}</span>) : (<></>) }
            <div className="card bg-gray-800 outline outline-1 outline-gray-700 rounded-xl">
                <div className="p-8">
                    {
                        components.map((component: Component, index: number) => (
                            <div className="flex" key={index.toString()}>
                                {
                                    processComponent(component.type, component.contents)
                                }
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    );
}

export default CardView;