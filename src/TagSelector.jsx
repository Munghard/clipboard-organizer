const TagSelector = ({ Select, AddTag, Tags, SelectedTags}) => {
    const handleSelect = (e) => {
        if (e.key === "Enter" && e.target.value.trim() !== "") {
            AddTag(e.target.value.trim());
            e.target.value = "";
        }
    };
    return (
        <div className="flex flex-col gap-2">
            <input type="text" placeholder="New tag" onKeyDown={handleSelect}></input>

            <div className="flex flex-wrap gap-1">
            {Tags.map((tag, i) => {
                return(
                    <button
                    key={i}
                    className={`${
                        SelectedTags &&
                        SelectedTags.some((t) => t.tagname === tag.tagname)
                          ? "button-success"
                          : "button-tags"
                      } button`}
                      

                    onClick={() => Select(tag)}>{tag.tagname}</button>
                )
            })}
            </div>
        </div>
    )
}
export default TagSelector;