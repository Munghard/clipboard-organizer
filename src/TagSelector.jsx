import { useContext } from "react";
import { TagsContext } from "./TagsContext";
import { ClipboardContext } from "./ClipBoardContext";

const TagSelector = ({entry}) => {

    const {tags,AddTag} = useContext(TagsContext);
    const {SelectTag,SelectedTags} = useContext(ClipboardContext);

    const selectedTags = SelectedTags(entry.id);

    const handleSelect = (e) => {
        if (e.key === "Enter" && e.target.value.trim() !== "") {
            AddTag(e.target.value.trim());
            e.target.value = "";
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <input type="text" placeholder="New tag" onKeyDown={handleSelect} />

            <div className="flex flex-wrap gap-1">
                {tags.map((tag) => {
                    // SelectedTags is always an array of IDs
                    const isSelected = selectedTags.includes(tag.id);
                    return (
                        <button
                            key={tag.id}
                            className={`${isSelected ? "button-success" : "button-tags"} button`}
                            onClick={() => SelectTag(tag,entry)}
                        >
                            {tag.name}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default TagSelector;
