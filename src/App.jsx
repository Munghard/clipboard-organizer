import { useState, useEffect } from 'react';
import './App.css';
import Entry from './Entry';
import { motion } from 'framer-motion';

function App() {
	// Load folders and entries from localStorage on mount
	const [folders, setFolders] = useState(() => {
		const data = JSON.parse(localStorage.getItem('entry_folder') || '[]');
		return Array.isArray(data) ? data : [];
	});

	const [entries, setEntries] = useState(() => {
		const order = JSON.parse(localStorage.getItem('entry_order') || '[]');
		return order.map((id) => {
			const entry = JSON.parse(localStorage.getItem(id) || '{}');
			return { id, ...entry };
		});
	});

	const [activeFolder, setActiveFolder] = useState('');
	const [newClipboardVisible, setNewClipboardVisible] = useState(false);
	const [editFolder, setEditFolder] = useState(false);
	const [clipboardData, setClipboardData] = useState('');
	const [clipboardFolder, setClipboardFolder] = useState('');
	const [newFolderName, setNewFolderName] = useState('');


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
	const editEntry = (id, newData) => {
		const updatedEntries = entries.map((e) =>
			e.id === id ? { ...e, data: newData } : e
		);
		setEntries(updatedEntries);

		const entry = JSON.parse(localStorage.getItem(id) || '{}');
		entry.data = newData;
		localStorage.setItem(id, JSON.stringify(entry));
	};
	const HandleChangeFolder = (id,folder)=>{
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

	// Clear all data
	const clearAll = () => {
		if (!window.confirm('Are you sure? This will clear all local data!')) return;
		localStorage.clear();
		setEntries([]);
		setFolders([]);
	};

	// Filtered entries for current folder
	const displayedEntries = entries.filter((e) =>
		activeFolder ? e.folder === activeFolder : true
	);

	// --- JSX ---
	return (
		<div className="container">
			<div className='flex'>

			<i className='fa fa-copy text-6xl text-zinc-400'></i> <p className="text-6xl text-zinc-400 mb-6">Clipboard Organizer</p>
			</div>
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
			</div>
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

			<div className="flex gap-2 mb-4">
				<button className="button button-secondary" onClick={() => {setActiveFolder(''); setClipboardFolder("")}}>
					All
				</button>
				{folders.map((f) => (
					<div key={f} className="flex gap-1">
						<button className="button button-secondary" onClick={() => {setActiveFolder(f); setClipboardFolder(f)}}>
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
			<motion.div className="grid grid-cols-[repeat(auto-fill,_minmax(300px,_1fr))] gap-2">
				{displayedEntries.length === 0 && <p>No clipboards in this folder.</p>}
				{displayedEntries.map((e) => (
					<Entry
						key={e.id}
						id={e.id}
						data={e.data}
						DeleteEntry={deleteEntry}
						EditEntry={editEntry}
						EditFolder={editFolder}
						Folder={e.folder}
						Folders={folders}
						HandleChangeFolder={HandleChangeFolder}
					/>
				))}
			</motion.div>
		</div>
	);
}

export default App;
