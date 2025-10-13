import { useState, useEffect, useRef } from 'react';
import './App.css';
import Entry from './Entry';
import { AnimatePresence, motion } from 'framer-motion';

function App() {
	// Load folders, tags and entries from localStorage on mount
	const [entries, setEntries] = useState(() => {
		const order = JSON.parse(localStorage.getItem('entry_order') || '[]');
		return order.map(id => {
			const entry = JSON.parse(localStorage.getItem(id) || '{}');
			return { id, ...entry };
		});
	});

	const [folders, setFolders] = useState(() => {
		const order = JSON.parse(localStorage.getItem('entry_order') || '[]');
		const folderSet = new Set();
		order.forEach(id => {
			const entry = JSON.parse(localStorage.getItem(id) || '{}');
			if (entry.folder) folderSet.add(entry.folder);
		});
		return Array.from(folderSet);
	});

	const [tags, setTags] = useState(() => {
		const stored = JSON.parse(localStorage.getItem('tags') || '[]');
		const tagSet = new Set(stored.map(tag => tag || []));
		return Array.from(tagSet);
	});


	const [activeFolder, setActiveFolder] = useState('');
	const [activeTag, setActiveTag] = useState('');

	const [newClipboardVisible, setNewClipboardVisible] = useState(false);

	const [editFolder, setEditFolder] = useState(false);

	const [editTags, setEditTags] = useState(false);
	const [clipboardData, setClipboardData] = useState('');

	const [clipboardFolder, setClipboardFolder] = useState('');
	const [clipboardTag, setClipboardTag] = useState('');

	const [newFolderName, setNewFolderName] = useState('');
	const [newTagName, setNewTagName] = useState('');

	const [showFolders, setShowFolders] = useState(true);
	const [showTags, setShowTags] = useState(true);

	const fileInputRef = useRef(null);

	const exportData = () => {
		const order = JSON.parse(localStorage.getItem('entry_order') || '[]');
		const entry_folder = JSON.parse(localStorage.getItem('entry_folder') || '[]');

		const exportObj = { entry_folder };

		order.forEach(id => {
			const entry = JSON.parse(localStorage.getItem(id) || '{}');
			exportObj[id] = entry; // entry contains {data, folder}
		});

		const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);

		const a = document.createElement('a');
		a.href = url;
		a.download = 'clipboard-export.json';
		a.click();
		URL.revokeObjectURL(url);
	};

	const importData = (file) => {
		const reader = new FileReader();
		reader.onload = (e) => {
		  try {
			const imported = JSON.parse(e.target.result);
	  
			const newFoldersSet = new Set();
			const newTagsSet = new Set();
	  
			Object.entries(imported).forEach(([id, entry]) => {
			  localStorage.setItem(id, JSON.stringify(entry));
	  
			  if (entry.folder) newFoldersSet.add(entry.folder);
	  
			  if (Array.isArray(entry.tags)) {
				entry.tags.forEach((t) => {
				  if (typeof t === "string") newTagsSet.add(t);
				  else if (t?.tagname) newTagsSet.add(t.tagname);
				});
			  }
			});
	  
			// Save folders
			localStorage.setItem("entry_folder", JSON.stringify(Array.from(newFoldersSet)));
	  
			// Save tags
			localStorage.setItem(
			  "tags",
			  JSON.stringify(Array.from(newTagsSet).map((t) => ({ tagname: t })))
			);
	  
			// Save order
			localStorage.setItem("entry_order", JSON.stringify(Object.keys(imported)));
	  
			window.location.reload();
		  } catch (err) {
			console.error("Failed to import:", err);
		  }
		};
		reader.readAsText(file);
	  };
	  


	const handleClick = () => {
		fileInputRef.current.click(); // trigger file picker
	};

	const handleFileChange = (e) => {
		if (e.target.files?.[0]) importData(e.target.files[0]);
	};

	// --- Helper functions ---
	const saveOrder = (order) => localStorage.setItem('entry_order', JSON.stringify(order));

	// Add a new entry
	const addEntry = () => {
		const id = 'entry_' + Date.now();
		const newEntry = { data: clipboardData, folder: clipboardFolder };
		localStorage.setItem(id, JSON.stringify(newEntry));

		const newOrder = [...entries.map(e => e.id), id];
		saveOrder(newOrder);

		setEntries([...entries, { id, ...newEntry }]);
		setClipboardData('');
		setClipboardFolder('');
		setNewClipboardVisible(false);
	};

	// Edit an entry
	const editEntry = (id, newData, tags) => {
		const updatedEntries = entries.map((e) =>
			e.id === id ? { ...e, data: newData, tags } : e
		);
		setEntries(updatedEntries);

		const entry = JSON.parse(localStorage.getItem(id) || '{}');
		entry.data = newData;
		entry.tags = tags;
		localStorage.setItem(id, JSON.stringify(entry));
		console.log("Entry edited, newdata: ", newData, "tags:", tags)
	};

	const HandleChangeFolder = (id, folder) => {
		const updatedEntries = entries.map((e) =>
			e.id === id ? { ...e, folder: folder } : e
		);
		setEntries(updatedEntries);
		const entry = JSON.parse(localStorage.getItem(id) || '{}');
		entry.folder = folder;
		localStorage.setItem(id, JSON.stringify(entry));
	}
	// Delete an entry
	const deleteEntry = (id) => {
		setEntries(entries.filter((e) => e.id !== id));
		localStorage.removeItem(id);

		const newOrder = entries.map(e => e.id).filter((eid) => eid !== id);
		saveOrder(newOrder);
	};

	// Add a new folder
	const addFolder = (name) => {
		if (!name || folders.includes(name)) return;
		const newFolders = [...folders, name];
		setFolders(newFolders);
		localStorage.setItem('entry_folder', JSON.stringify(newFolders));
	};

	// Delete a folder
	const deleteFolder = (folderName) => {
		const newFolders = folders.filter((f) => f !== folderName);
		setFolders(newFolders);
		localStorage.setItem('entry_folder', JSON.stringify(newFolders));

		// Move entries from deleted folder to "All" (empty folder)
		const updatedEntries = entries.map((e) =>
			e.folder === folderName ? { ...e, folder: '' } : e
		);
		setEntries(updatedEntries);
		updatedEntries.forEach((e) =>
			localStorage.setItem(e.id, JSON.stringify({ data: e.data, folder: e.folder }))
		);
	};

	// Add a tag
	const AddTag = (t) => {
		const stored = JSON.parse(localStorage.getItem("tags")) || [];

		if (stored.some((tag) => tag.tagname.toLowerCase() === t.toLowerCase())) return;

		const updated = [...stored, { tagname: t }];
		setTags(updated);
		localStorage.setItem("tags", JSON.stringify(updated));
	};

	// Remove a tag by index
	const RemoveTag = (i) => {
		const stored = JSON.parse(localStorage.getItem("tags")) || [];

		const updated = stored.filter((_, index) => index !== i);
		setTags(updated);
		localStorage.setItem("tags", JSON.stringify(updated));
	};

	// Load tags from localStorage
	const GetTags = () => {
		const stored = JSON.parse(localStorage.getItem("tags")) || [];
		setTags(stored);
	};

	// Clear all data
	const clearAll = () => {
		if (!window.confirm('Are you sure? This will clear all local data!')) return;
		localStorage.clear();
		setEntries([]);
		setFolders([]);
		setTags([]);
	};

	// filter displayed entries
	const displayedEntries = entries.filter(
		(e) =>
			(!activeFolder || e.folder === activeFolder) &&
			(!activeTag || e.tags?.some(t => t.tagname === activeTag))
	);


	// --- JSX ---
	return (
		<div className="container">
			<div className='flex  mb-2'>
				<i className='fa fa-copy text-5xl text-zinc-400'></i> <p className="text-5xl text-zinc-400 mb-6">Clipboard Organizer</p>
			</div>
			{/*TOP BUTTONS */}
			<div className="flex gap-2 mb-4">
				<button className="button button-danger" onClick={clearAll}>
					<i className='fa fa-trash'></i> Clear all
				</button>
				<button
					className="button button-primary"
					onClick={() => setNewClipboardVisible(!newClipboardVisible)}
				>
					<i className='fa fa-pen'></i> New Clipboard
				</button>
				<button
					className="button button-warning"
					onClick={() => setEditFolder(!editFolder)}
				>
					<i className='fa fa-folder'></i> Folders
				</button>
				<button
					className="button button-warning"
					onClick={() => { setShowFolders(!showFolders); }}
				>
					<i className='fa fa-eye'></i>
				</button>
				<button
					className="button button-tags"
					onClick={() => setEditTags(!editTags)}
				>
					<i className='fa fa-tag'></i> Tags
				</button>
				<button
					className="button button-tags"
					onClick={() => { setShowTags(!showTags) }}
				>
					<i className='fa fa-eye'></i>
				</button>
				<button
					className="button button-secondary ms-auto"
					onClick={() => exportData()}
				>
					<i className='fa fa-download'></i> Export
				</button>

				<button onClick={handleClick} className="button button-secondary">
					<i className='fa fa-folder-open'></i> Import
				</button>
				<input
					type="file"
					accept="application/json"
					ref={fileInputRef}
					onChange={handleFileChange}
					className="hidden"
				/>
			</div>
			{/* EDIT TAGS */}
			{editTags &&
				<div className="flex gap-2 mb-4 items-center">
					<input
						type="text"
						placeholder="New tag name"
						value={newTagName}
						onChange={(e) => setNewTagName(e.target.value)}
						className="p-2 border rounded"
					/>
					<button
						className="button button-success"
						onClick={() => {
							AddTag(newTagName);
							setNewTagName("");
						}}
					>
						<i className='fa fa-add'></i> Add Tag
					</button>
				</div>
			}
			{/* EDIT FOLDER */}
			{editFolder &&
				<div className="flex gap-2 mb-4 items-center">
					<input
						type="text"
						placeholder="New folder name"
						value={newFolderName}
						onChange={(e) => setNewFolderName(e.target.value)}
						className="p-2 border rounded"
					/>
					<button
						className="button button-success"
						onClick={() => {
							addFolder(newFolderName);
							setNewFolderName("");
						}}
					>
						<i className='fa fa-add'></i> Add Folder
					</button>
				</div>
			}

			{/* NEW CLIPBOARD */}
			{newClipboardVisible && (
				<div className="mb-4 max-w-xl">
					<textarea
						placeholder="Clipboard content"
						value={clipboardData}
						onChange={(e) => setClipboardData(e.target.value)}
						className="w-full mb-2 p-2 border rounded"
						rows={3}
					/>
					<select
						value={clipboardFolder}
						onChange={(e) => setClipboardFolder(e.target.value)}
						className="mb-2 p-2 border rounded bg-zinc-950"
					>
						<option value="">{activeFolder || "All"} </option>
						{folders.map((f) => (
							<option key={f} value={f}>
								{f}
							</option>
						))}
					</select>
					<button className="button button-success ms-2" onClick={addEntry}>
						<i className='fa fa-save'></i> Save
					</button>
				</div>
			)}
			{/* SET TAG */}
			{showTags &&
				<>

					<p className='text-md text-purple-600 m-0 py-1'>Tags:</p>
					<div className="flex flex-wrap gap-2 mb-4">
						<button className="button button-secondary" onClick={() => { setActiveTag(''); setClipboardTag("") }}>
							All
						</button>
						{tags.map((f, i) => (
							<div key={f.tagname} className="flex gap-1">
								<button className="button button-tags" onClick={() => { setActiveTag(f.tagname); setClipboardTag(f.tagname) }}>
									{f.tagname}
								</button>
								{editTags &&
									<button className="button button-danger" onClick={() => RemoveTag(i)}>
										<i className="fa fa-trash"></i>
									</button>
								}
							</div>
						))}
					</div>
				</>
			}
			{showFolders &&
				<>
					{/* SET FOLDER */}
					<p className='text-md text-yellow-600 m-0 py-1'>Folders:</p>
					<div className="flex gap-2 mb-4">
						<button className="button button-secondary" onClick={() => { setActiveFolder(''); setClipboardFolder("") }}>
							All
						</button>
						{folders.map((f) => (
							<div key={f} className="flex gap-1">
								<button className="button button-warning" onClick={() => { setActiveFolder(f); setClipboardFolder(f) }}>
									{f}
								</button>
								{editFolder &&
									<button className="button button-danger" onClick={() => deleteFolder(f)}>
										<i className="fa fa-trash"></i>
									</button>
								}
							</div>
						))}
					</div>
				</>
			}
			<motion.div className="grid grid-cols-[repeat(auto-fill,_minmax(300px,_1fr))] gap-2">
				<AnimatePresence>
					{displayedEntries.length === 0 && (
						<motion.p
							key="empty"
							initial={{ opacity: 0, scaleY: 0 }}
							animate={{ opacity: 1, scaleY: 1 }}
							exit={{ opacity: 0, scale: 0 }}
						>
							No clipboards in this folder.
						</motion.p>
					)}
					{displayedEntries.map((e) => (
						<motion.div
							className='flex'
							initial={{ scale: 1, rotate: 0 }}
							exit={{ scale: 0, rotate: 180 }}
							transition={{ duration: 0.2 }}
							layout
							key={e.id}
						>

							<Entry
								key={e.id}
								id={e.id}
								data={e.data}
								Entry={e}
								DeleteEntry={deleteEntry}
								EditEntry={editEntry}
								EditFolder={editFolder}
								Folder={e.folder}
								Folders={folders}
								tags={e.tags}
								AllTags={tags}
								AddTag={AddTag}
								HandleChangeFolder={HandleChangeFolder}
							/>
						</motion.div>
					))}
				</AnimatePresence>
			</motion.div>
		</div>
	);
}

export default App;
