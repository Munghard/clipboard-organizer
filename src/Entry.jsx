import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
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
    const [editValue, setEditValue] = useState(Entry.data);
    const [selectTag, setSelectTag] = useState(false);
    const [showButtons, setShowButtons] = useState(false);
    const [showBlowUp, setShowBlowUp] = useState(false);

    useEffect(() => {
        setEditValue(Entry.data);
    }, [Entry.data]);


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

    function BlowUp() {
        const [_startEdit, _setStartEdit] = useState(false);
        const [_selectTag, _setSelectTag] = useState(false);

        return (
            <div className="bg-black bg-opacity-80 fixed inset-0 flex items-center justify-center z-50" >
                <div className="p-4 bg-zinc-950 border-zinc-800 border-2 rounded-xl max-w-3xl overflow-auto">
                    <div
                        initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                        className="flex gap-2 place-content-between origin-top mb-4 rounded-md inset-x-2">
                        <button className="btn btn-sm close" title="Delete" onClick={() => DeleteEntry(Entry.id)}>
                            <i className="fa fa-trash"></i>
                        </button>
                        <button className="btn btn-sm close" title="Edit" onClick={() => _setStartEdit(true)}>
                            <i className="fa fa-pen"></i>
                        </button>

                        <button className="btn btn-sm close" title="Entry.tags" onClick={() => _setSelectTag(!_selectTag)}>
                            <i className="fa fa-tag"></i>
                        </button>

                        <button className="btn btn-sm close" title="Copy" onClick={(e) => CopyEntry(e)}>
                            <i className="fa fa-copy"></i>
                        </button>
                        <button className="btn btn-sm close" title="Close" onClick={() => setShowBlowUp(false)}>
                            <i className="fa fa-x"></i>
                        </button>
                    </div>

                    {_startEdit ? (
                        <textarea
                            ref={(el) => {
                                if (el) {
                                    el.style.height = "auto";
                                    el.style.height = `${el.scrollHeight}px`;
                                }
                            }}
                            value={editValue}
                            onChange={(e) => {
                                setEditValue(e.target.value);
                                const el = e.target;
                                el.style.height = "auto";
                                el.style.height = `${el.scrollHeight}px`;
                            }}
                            onBlur={() => {
                                EditEntry(Entry.id, editValue);
                                _setStartEdit(false);
                            }}
                            onKeyDown={(k) => {
                                if (k.key === "Enter" && !k.shiftKey) {
                                    EditEntry(Entry.id, editValue);
                                    _setStartEdit(false);
                                }
                                if (k.key === "Escape") {
                                    _setStartEdit(false);
                                }
                            }}
                            className="text-gray-300 text-xl w-200 whitespace-pre-wrap break-words bg-transparent border-none outline-none resize-none overflow-hidden font-inherit leading-normal"
                            autoFocus
                        />
                    ) : (
                        <p className="text-gray-300 text-xl w-full whitespace-pre-wrap break-words">
                            {Entry.data}
                        </p>
                    )}
                    {_selectTag &&
                        <TagSelector Tags={AllTags} AddTag={AddTag} Select={SelectTag} SelectedTags={Entry.tags || []}></TagSelector>
                    }
                    {copied && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2  bg-zinc-900 text-white text-2xl px-2 py-1 rounded shadow-md">
                            Copied!
                        </div>
                    )}
                </div>
            </div>
        )
    }



    return (
        <>
            {
                showBlowUp && <BlowUp></BlowUp>
            }
            <motion.div
                className="p-2 bg-zinc-950 flex flex-col border-zinc-800 hover:border-zinc-500 border-2 rounded-xl min-w-32 max-w-lg relative"
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
                            <button className="btn btn-sm close" title="Edit" onClick={(e) => {e.stopPropagation(); setStartEdit(true)}}>
                                <i className="fa fa-pen"></i>
                            </button>

                            <button className="btn btn-sm close" title="Tags" onClick={(e) => {e.stopPropagation(); setSelectTag(!selectTag)}}>
                                <i className="fa fa-tag"></i>
                            </button>

                            <button className="btn btn-sm close" title="Open" onClick={(e) =>{ e.stopPropagation(); setShowBlowUp(true)}}>
                                <i className="fa fa-expand"></i>
                            </button>
                            
                            <button className="btn btn-sm close" title="Copy" onClick={(e) => {e.stopPropagation(); CopyEntry(e)}}>
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
                        <p className="text-gray-300 text-xl w-full min-h-[80px] max-h-40 overflow-y-auto whitespace-pre-wrap break-words">{Entry.data}</p>
                    )}

                    {copied && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-zinc-900 text-white text-2xl px-2 py-1 rounded shadow-md">
                            Copied!
                        </div>
                    )}
                </div>
                {EditFolder &&

                    <select onClick={(e)=>e.stopPropagation()} onChange={(e) => { HandleChangeFolder(Entry.id, e.target.value)}} value={Entry.folder} className="bg-yellow-800 rounded-sm me-auto px-2 py-1 ">
                        {Folders.map((e) => {
                            return <option key={e}>{e}</option>
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
