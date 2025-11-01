import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import TagSelector from "./TagSelector"

const Entry = ({
    Entry,
    DeleteEntry,
    EditEntryContent,
    EditEntryTags,
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
    const [selectFolder, setSelectFolder] = useState(false);

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
        const entryTags = Entry.entry_tags || []; // array of {id, name}
        const exists = entryTags.some(t => t.id === tag.id);
        const newTags = exists
            ? entryTags.filter(t => t.id !== tag.id) // remove
            : [...entryTags, { id: tag.id, name: tag.name }]; // add
    
        EditEntryTags(Entry.id, newTags);
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
            {showBlowUp && <div className="absolute inset-0 bg-black/80 z-999 w-100 h-100">
            </div>}

            <motion.div
                className={`p-2 bg-zinc-950 flex flex-col h-auto border-zinc-800 hover:border-zinc-500 border-2 rounded-xl   
                    ${showBlowUp ?
                        "absolute sm:w-full md:w-3/4 lg:w-1/2 h-75 z-999 left-1/2 top-1/2 -translate-1/2" :
                        "relative min-w-32 min-h-50 max-w-lg z-auto"}  `}
                layout
                transition={{ layout: { duration: 0.3, type: "spring" } }}
                initial={{ y: -200, scaleY: 0, opacity: 0 }}
                animate={{ y: 0, scaleY: 1, opacity: 1 }}
                duration={{ duration: 1, type: "spring" }}
                // onClick={() => setShowButtons(!showButtons)}
                onDoubleClick={() => { setShowBlowUp(true); setShowButtons(true); }}
            // onTap={() => setShowButtons(!showButtons)}
            >
                {showButtons &&
                    <AnimatePresence>

                        <motion.div
                            initial={{ scaleY: 0 }}
                            animate={{ scaleY: 1 }}
                            className="flex gap-2 place-content-between origin-top bg-zinc-800 rounded-md  inset-x-2 mb-5">
                            <button className="btn btn-sm close" title="Delete" onClick={() => {if(confirm("Are you sure you want to delete this?")){ DeleteEntry(Entry.id);}}}>
                                <i className="fa fa-trash"></i>
                            </button>
                            <button className={`btn btn-sm close`} title="Edit" onClick={(e) => { e.stopPropagation(); setStartEdit(true) }}>
                                <i className={`fa fa-pen ${startEdit? 'text-white':'text-gray-500'}`}></i>
                            </button>

                            <button className="btn btn-sm close" title="Tags" onClick={(e) => { e.stopPropagation(); setSelectTag(!selectTag) }}>
                                <i className={`fa fa-tag ${selectTag? 'text-white':'text-gray-500'}`}></i>
                            </button>

                            <button className="btn btn-sm close" title="Folders" onClick={(e) => { e.stopPropagation(); setSelectFolder(!selectFolder) }}>
                            <i className={`fa fa-folder ${selectFolder? 'text-white':'text-gray-500'}`}></i>
                            </button>

                            <button className="btn btn-sm close" title="Copy" onClick={(e) => { e.stopPropagation(); CopyEntry(e) }}>
                                <i className="fa fa-copy"></i>
                            </button>

                            <button className="btn btn-sm close" title="Close" onClick={(e) => { e.stopPropagation(); setShowBlowUp(false); setShowButtons(false); }}>
                                <i className="fa fa-x"></i>
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
                                EditEntryContent(Entry.id, editValue);
                                setStartEdit(false);
                            }}
                            onKeyDown={(k) => {
                                if (k.key === "Enter" && !k.shiftKey) {
                                    EditEntryContent(Entry.id, editValue);
                                    setStartEdit(false);
                                }
                                if (k.key === "Escape") {
                                    setStartEdit(false);
                                }
                            }}
                            className="p-1 rounded !text-xl text-white border-none outline-none font-sans font-inherit"
                            autoFocus
                            rows={3}
                        />
                    ) : (
                        <p className={`text-gray-300 text-xl w-full min-h-[80px] ${showBlowUp ? 'max-h-200' : 'max-h-40'} overflow-y-auto whitespace-pre-wrap break-words`}>{Entry.content}</p>
                    )}

                    {copied && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-zinc-900 text-white text-2xl px-2 py-1 rounded shadow-md">
                            Copied!
                        </div>
                    )}
                </div>
                {(EditFolder || selectFolder) &&
                    <div className="mb-4">
                        <p className="text-gray-400 ">Folder</p>
                        <select onClick={(e) => e.stopPropagation()} onChange={(e) => { HandleChangeFolder(Entry.id, e.target.value) }} value={Entry.folder_id} className="bg-yellow-800 rounded-sm me-auto px-2 py-1 !text-xl">
                            <option value={null}>None</option>
                            {Folders.map((folder, index) => {
                                return <option key={index} value={folder.id}>{folder.name}</option>
                            })}
                        </select>
                    </div>
                }
                {(selectTag || EditTags) &&
                    <TagSelector
                        Tags={AllTags}
                        AddTag={AddTag}
                        Select={SelectTag}
                        // Pass array of tag IDs
                        SelectedTags={(Entry.entry_tags || []).map(t => t.id)}
                    />
                }
                {startEdit && <p className="text-gray-400 text-center">Hit Enter or escape to stop editing.</p>}
                {/* <h1>{Entry.id}</h1> */}
            </motion.div>
        </>
    );
};

export default Entry;
