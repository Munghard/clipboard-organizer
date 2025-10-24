import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect , useLayoutEffect , useRef} from "react";
import TagSelector from "./TagSelector"

const Entry = ({
    Entry,
    DeleteEntry,
    EditEntry,
    EditFolder,
    Folders,
    HandleChangeFolder,
    AllTags,
    AddTag,
    EditTags
}) => {

    const [copied, setCopied] = useState(false);
    const [startEdit, setStartEdit] = useState(false);
    const [editValue, setEditValue] = useState(null);
    const [selectTag, setSelectTag] = useState(false);
    const [showButtons, setShowButtons] = useState(false);
    const [showBlowUp, setShowBlowUp] = useState(false);


    

    useEffect(() => {
        if (!startEdit) setEditValue(Entry.content);
    }, [Entry.content, startEdit]);


    const CopyEntry = (e) => {
        if (e.button === 0) {
            navigator.clipboard.writeText(Entry.data);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        }
    };


    const SelectTag = (tag) => {
        const entryTags = Entry.tags || [];

        let newTags;
        if (entryTags.includes(tag)) {
            // Tag is already selected → remove it
            newTags = entryTags.filter((t) => t !== tag);
        } else {
            // Tag not selected → add it
            newTags = [...entryTags, tag];
        }

        EditEntry(Entry.id, Entry.data, newTags);
    };


    const textareaRef = useRef(null);

    useLayoutEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [editValue]);


    return (
        <>
            <motion.div
                className={`p-2 bg-zinc-950 flex flex-col border-zinc-800 hover:border-zinc-500 border-2 rounded-xl  max-w-lg 
                    ${showBlowUp ? 
                        "absolute w-75 h-75 z-auto" :
                         "relative min-w-32"}  `}
                layout
                transition={{ layout: { duration: 0.3, type: "spring" } }}
                initial={{ y: -200, scaleY: 0, opacity: 0 }}
                animate={{ y: 0, scaleY: 1, opacity: 1 }}
                duration={{ duration: 1, type: "spring" }}
                onClick={() => setShowButtons(!showButtons)}
                onTap={() => setShowButtons(!showButtons)}
            >
                {showButtons &&
                    <AnimatePresence>

                        <motion.div
                            initial={{ scaleY: 0 }}
                            animate={{ scaleY: 1 }}
                            className="flex gap-2 place-content-between origin-top bg-zinc-800 rounded-md  inset-x-2">
                            <button className="btn btn-sm close" title="Delete" onClick={() => DeleteEntry(Entry.id)}>
                                <i className="fa fa-trash"></i>
                            </button>
                            <button className="btn btn-sm close" title="Edit" onClick={(e) => { e.stopPropagation(); setStartEdit(true) }}>
                                <i className="fa fa-pen"></i>
                            </button>

                            <button className="btn btn-sm close" title="Tags" onClick={(e) => { e.stopPropagation(); setSelectTag(!selectTag) }}>
                                <i className="fa fa-tag"></i>
                            </button>

                            <button className="btn btn-sm close" title="Open" onClick={(e) => { e.stopPropagation(); setShowBlowUp(!showBlowUp) }}>
                                <i className="fa fa-expand"></i>
                            </button>

                            <button className="btn btn-sm close" title="Copy" onClick={(e) => { e.stopPropagation(); CopyEntry(e) }}>
                                <i className="fa fa-copy"></i>
                            </button>
                        </motion.div>
                    </AnimatePresence>
                }
                <div
                    className="flex flex-col w-full"
                    onClick={(e) => {
                        if (startEdit || true) return; // remove true to enable copying by clicking the element
                        if (e.target.tagName === "BUTTON" || e.target.closest("button") || e.target.tagName === "SELECT") return;
                        CopyEntry(e);
                    }}
                >


                    {startEdit ? (
                        <textarea
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => {
                                EditEntry(Entry.id, editValue);
                                setStartEdit(false);
                            }}
                            onKeyDown={(k) => {
                                if (k.key === "Enter" && !k.shiftKey) {
                                    EditEntry(Entry.id, editValue);
                                    setStartEdit(false);
                                }
                                if (k.key === "Escape") {
                                    setStartEdit(false);
                                }
                            }}
                            className="p-1 rounded text-xl text-white"
                            autoFocus
                            rows={3}
                        />
                    ) : (
                        <p className="text-gray-300 text-xl w-full min-h-[80px] max-h-40 overflow-y-auto whitespace-pre-wrap break-words">{Entry.content}</p>
                    )}

                    {copied && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-zinc-900 text-white text-2xl px-2 py-1 rounded shadow-md">
                            Copied!
                        </div>
                    )}
                </div>
                {EditFolder &&
                    <select onClick={(e) => e.stopPropagation()} onChange={(e) => { HandleChangeFolder(Entry.id, e.target.value) }} value={Entry.folder_id} className="bg-yellow-800 rounded-sm me-auto px-2 py-1 ">
                        <option value={null}>None</option>
                        {Folders.map((folder, index) => {
                            return <option key={index} value={folder.id}>{folder.name}</option>
                        })}
                    </select>
                }
                {(selectTag || EditTags) &&
                    <TagSelector Tags={AllTags} AddTag={AddTag} Select={SelectTag} SelectedTags={Entry.tags || []}></TagSelector>
                }
            </motion.div>
        </>
    );
};

export default Entry;
