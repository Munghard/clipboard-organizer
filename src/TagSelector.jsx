const TagSelector = ({ Select, AddTag, Tags, SelectedTags }) => {
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
                {Tags.map((tag) => {
                    // SelectedTags is always an array of IDs
                    const isSelected = SelectedTags?.includes(tag.id);
                    return (
                        <button
                            key={tag.id}
                            className={`${isSelected ? "button-success" : "button-tags"} button`}
                            onClick={() => Select(tag)}
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
