import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const Entry = ({ DeleteEntry, EditEntry, EditFolder, Folders, id, data, Folder, HandleChangeFolder }) => {
    const [copied, setCopied] = useState(false);
    const [startEdit, setStartEdit] = useState(false);
    const [editValue, setEditValue] = useState(data);


    useEffect(() => {
        setEditValue(data);
    }, [data]);


    const HandleClick = (e) => {
        if (e.button === 0) {
            navigator.clipboard.writeText(data);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        }
    };

    return (
        <motion.div
            className="p-2 bg-zinc-950 flex border-zinc-800 hover:border-zinc-500 border-2 rounded-xl min-w-32 max-w-lg relative"
            layout
            transition={{ layout: { duration: 0.3, type: "spring" } }}
            initial={{ y: -200, scaleY: 0, opacity: 0 }}
            animate={{ y: 0, scaleY: 1, opacity: 1 }}
            duration={{ duration: 1, type: "spring" }}
        >
            <div
                className="flex flex-col w-full"
                onClick={(e) => {
                    if (startEdit) return;
                    if (e.target.tagName === "BUTTON" || e.target.closest("button") || e.target.tagName === "SELECT") return;
                    HandleClick(e);
                }}
            >
                {EditFolder &&

                    <select onChange={(e) => HandleChangeFolder(id, e.target.value)} value={Folder} className="bg-zinc-800 rounded-sm me-auto px-2 py-1 ">
                        {Folders.map((e) => {
                            return <option key={e}>{e}</option>
                        })}
                    </select>
                }

                {startEdit ? (
                    <textarea
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => {
                            EditEntry(id, editValue);
                            setStartEdit(false);
                        }}
                        onKeyDown={(k) => {
                            if (k.key === "Enter" && !k.shiftKey) {
                                EditEntry(id, editValue);
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
                    <p className="text-gray-300 text-xl w-full min-h-[80px] max-h-40 overflow-y-auto whitespace-pre-wrap break-words">{data}</p>

                )}

                {copied && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-zinc-900 text-white text-2xl px-2 py-1 rounded shadow-md">
                        Copied!
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-2 ml-auto">
                <button className="btn btn-sm close" onClick={() => DeleteEntry(id)}>
                    <i className="fa fa-trash"></i>
                </button>
                <button className="btn btn-sm close" onClick={() => { setStartEdit(true) }}>
                    <i className="fa fa-pen"></i>
                </button>
                <button className="btn btn-sm close" onClick={(e) => HandleClick(e)}>
                    <i className="fa fa-copy"></i>
                </button>
            </div>
        </motion.div>
    );
};

export default Entry;
