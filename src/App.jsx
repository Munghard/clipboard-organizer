import { useState, useEffect, useRef } from 'react';
import './App.css';
import Entry from './Entry';
import { AnimatePresence, motion } from 'framer-motion';
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://beuklwmjpfhhsaxokdpy.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJldWtsd21qcGZoaHNheG9rZHB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMTc3MTcsImV4cCI6MjA3Njg5MzcxN30.vk6qztoJbK_2gvbCRNH7L4ZYLlrDUn9Zk8uFe9J6Bh0')

function App() {
	// Load folders, tags and entries from localStorage on mount
	const [entries, setEntries] = useState([]);
	const [folders, setFolders] = useState([]);
	const [tags, setTags] = useState([]);

	useEffect(() => {
		const fetchData = async () => {
			// Fetch userid
			const { data: { user }, error } = await supabase.auth.getUser();
			if (error) {
				console.error(error);
				return;
			}
			else {
				console.log('user was fetched successfully', user.id);
			}
			setUserName(user.user_metadata.full_name);
			setUserId(user.id);
			const userId = user.id;


			if (userId == null) return;
			// Fetch entries
			const { data: entriesData, error: entriesError } = await supabase
				.from('entries')
				.select(`*, entry_tags(tags(name))`)
				.eq('user_id', userId);

			if (entriesError) console.error(entriesError);
			else setEntries(entriesData);

			console.log(entriesData);

			// Fetch folders
			const { data: foldersData, error: foldersError } = await supabase
				.from('folders')
				.select('*')
				.eq('user_id', userId);
			if (foldersError) console.error(foldersError);
			else setFolders(foldersData);

			console.log(foldersData);
			// Fetch tags
			const { data: tagsData, error: tagsError } = await supabase
				.from('tags')
				.select('*')
				.eq('user_id', userId);
			if (tagsError) console.error(tagsError);
			else {
				setTags(tagsData);
			}
			console.log(tagsData);
		};

		fetchData();
	}, []);

	const signInWithGoogle = async () => {
		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: 'google',
		});

		if (error) console.error('Login error:', error);
	};



	const [userName, setUserName] = useState(null);
	const [userId, setUserId] = useState(null);

	const [activeFolder, setActiveFolder] = useState('');
	const [activeTag, setActiveTag] = useState('');

	const [newClipboardVisible, setNewClipboardVisible] = useState(false);

	const [editFolder, setEditFolder] = useState(false);

	const [editTags, setEditTags] = useState(false);
	const [clipboardData, setClipboardData] = useState('');

	const [clipboardFolder, setClipboardFolder] = useState(null);
	const [clipboardTag, setClipboardTag] = useState('');

	const [newFolderName, setNewFolderName] = useState('');
	const [newTagName, setNewTagName] = useState('');

	const [showExtras, setShowExtras] = useState(false);

	const [showFolders, setShowFolders] = useState(false);
	const [showTags, setShowTags] = useState(false);

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


	// Add a new entry
	const addEntry = async () => {

		if (userId == "") {
			console.log("Not logged in.")
			return;
		}

		const newEntry = {
			content: clipboardData,
			folder_id: clipboardFolder.id || null
		};

		const { data, error } = await supabase
			.from('entries')
			.insert(newEntry)
			.select();

		if (error) {
			console.error("shit the bed");
			return;
		}


		setEntries([...entries, data[0]]);
		setClipboardData('');
		setClipboardFolder('');
		setNewClipboardVisible(false);
	};

	// Edit an entry
	const editEntry = async (id, newContent, tags) => {
		// 1. Update local state
		const updatedEntries = entries.map(e =>
		  e.id === id ? { ...e, data: newContent, tags } : e
		);
		setEntries(updatedEntries);
	  
		// 2. Update Supabase entry
		const { error } = await supabase
		  .from('entries')
		  .update({ content: newContent })
		  .eq('id', id);
	  
		if (error) console.error('Error updating entry:', error);
	  
		// 3. Update tags in entry_tags
		// (Assuming tags is an array of tag ids)
		// Delete old tags first
		await supabase.from('entry_tags').delete().eq('entry_id', id);
		// Insert new tags
		
		const tagInserts = (tags || []).map(tag_id => ({ entry_id: id, tag_id }));
		if (tagInserts.length > 0) {
		  const { error: tagsError } = await supabase.from('entry_tags').insert(tagInserts);
		  if (tagsError) console.error('Error updating entry tags:', tagsError);
		}
		
	  };
	  

	const HandleChangeFolder = async (id, folder_id) => {
		// Update local state
		const prevEntries = [...entries];
		const updatedEntries = entries.map(e =>
			e.id === id ? { ...e, folder_id:folder_id } : e
		);
		setEntries(updatedEntries);

		// Update in Supabase
		const { error } = await supabase
			.from('entries')
			.update({ folder_id : folder_id })
			.eq('id', id);

		if (error) {
			console.error('Error updating entry folder:', error);
			setEntries(prevEntries); // rollback
			return;
		}

		// Update localStorage
		const updatedEntry = updatedEntries.find(e => e.id === id);
		localStorage.setItem(id, JSON.stringify(updatedEntry));
	};


	// Delete an entry
	const deleteEntry = (id) => {
		setEntries(entries.filter((e) => e.id !== id));
		// localStorage.removeItem(id);
		supabase.from('entries').delete().eq(id);

		const newOrder = entries.map(e => e.id).filter((eid) => eid !== id);
		saveOrder(newOrder);
	};

	// Add a new folder
	const addFolder = async (name) => {
		if (!name || folders.some(f => f.name === name)) return;

		const newFolder = { name, user_id: userId };

		const { data, error } = await supabase
			.from('folders')
			.insert([newFolder]) // insert expects an array
			.select();           // select to get the inserted row back

		if (error) {
			console.error('Error adding folder:', error);
			return;
		}

		// Update state with the inserted folder
		setFolders([...folders, data[0]]);
	};

	// Delete a folder
	const deleteFolder = async (folderId) => {
		// Remove from local state
		const newFolders = folders.filter(f => f.id !== folderId);
		setFolders(newFolders);

		// Delete folder in Supabase
		const { error } = await supabase.from('folders').delete().eq('id', folderId);
		if (error) console.error('Error deleting folder:', error);

		// Move entries from deleted folder to empty folder
		const updatedEntries = entries.map(e =>
			e.folder === folderId ? { ...e, folder: '' } : e
		);
		setEntries(updatedEntries);

		// Optionally update Supabase entries
		const { error: entriesError } = await supabase
			.from('entries')
			.update({ folder_id: '' })
			.eq('folder', folderId);
		if (entriesError) console.error('Error updating entries:', entriesError);
	};


	// Add a tag
	const AddTag = async (t) => {
		// Fetch existing tags for this user
		const { data: stored, error } = await supabase
		  .from('tags')
		  .select('*')
		  .eq('user_id', userId);
	  
		if (error) {
		  console.error('Error fetching tags:', error);
		  return;
		}
	  
		// Check if tag already exists (case-insensitive)
		if (stored.some(tag => tag.name.toLowerCase() === t.toLowerCase())) return;
	  
		// Insert new tag into Supabase
		const { data: newTag, error: insertError } = await supabase
		  .from('tags')
		  .insert([{ name: t, user_id: userId }])
		  .select(); // returns inserted row
	  
		if (insertError) {
		  console.error('Error inserting tag:', insertError);
		  return;
		}
	  
		// Update local state and localStorage
		const updated = [...stored, ...newTag];
		setTags(updated);
		localStorage.setItem("tags", JSON.stringify(updated));
	  };
	  

	// Remove a tag by index
	const RemoveTag = async (id) => {
		// Delete all entry_tags that reference this tag
		await supabase.from('entry_tags').delete().eq('tag_id', id);

		// Delete tag from Supabase
		const { data, error } = await supabase
		  .from('tags')
		  .delete()
		  .eq('id', id)
		  .eq('user_id', userId);
	  
		if (error) {
		  console.error('Error deleting tag:', error);
		  return;
		}
	  
		// Remove tag from local state
		const updated = tags.filter(tag => tag.id !== id);
		setTags(updated);
	  
		// Update localStorage
		localStorage.setItem("tags", JSON.stringify(updated));
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
	const displayedEntries = entries.filter(e =>
		(!activeFolder || e.folder === activeFolder) &&
		(!activeTag || e.entry_tags?.some(t => t.tags.name === activeTag))
	);


	

	// --- JSX ---
	return (
		<div className="container">
			<div className='flex  mb-2'>
				<i className='fa fa-copy text-5xl text-zinc-400'></i> <p className="text-5xl text-zinc-400 mb-6">Clipboard Organizer</p>
			</div>
			
			{userId && <p className='text-sm font-bold text-green-500'>Logged in as: {userName}</p>}
			{/*TOP BUTTONS */}
			<div className="flex flex-wrap gap-2 mb-4">
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
				<div className='ms-auto flex gap-2'>
					{showExtras &&
						<button className="button button-danger" onClick={clearAll}>
							<i className='fa fa-trash'></i> Clear all
						</button>
					}
					{showExtras &&
						<>
							<button
								className="button button-secondary"
								onClick={() => exportData()}
							>
								<i className='fa fa-download'></i> Export
							</button>

							<button onClick={handleClick} className="button button-secondary">
								<i className='fa fa-folder-open'></i> Import
							</button>

							<button onClick={signInWithGoogle} className="button button-success">
								<i className='fa fa-right-to-bracket'></i> Sign in with google
							</button>
						</>
					}
					<button
						onClick={() => setShowExtras(!showExtras)}
						className='button button-secondary'>
						<i className='fa fa-bars'></i>
					</button>
				</div>
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
							<option key={f.id} value={f.name}>
								{f.name}
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
						{tags.map((tag, index) => (
							<div key={index} className="flex gap-1">
								<button className="button button-tags" onClick={() => { setActiveTag(tag.id); setClipboardTag(tag.id) }}>
									{tag.name}
								</button>
								{editTags &&
									<button className="button button-danger" onClick={() => RemoveTag(tag.id)}>
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
					<div className="flex flex-wrap gap-2 mb-4">
						<button className="button button-secondary" onClick={() => { setActiveFolder(''); setClipboardFolder("") }}>
							All
						</button>
						{folders.map((folder, index) => (
							<div key={index} className="flex gap-1">
								<div className='flex gap-1'>
									<button className="button button-warning" onClick={() => { setActiveFolder(folder.id); setClipboardFolder(folder.id) }}>
										{folder.name}
									</button>
									{editFolder &&
										<button className="button button-danger" onClick={() => deleteFolder(folder.id)}>
											<i className="fa fa-trash"></i>
										</button>
									}
								</div>
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
					{entries && displayedEntries.map((entry) => (
						<motion.div
							className='flex flex-col'
							initial={{ scale: 1, rotate: 0 }}
							exit={{ scale: 0, rotate: 180 }}
							transition={{ duration: 0.2 }}
							layout
							key={entry.id}
						>

							<Entry
								key={entry.id}
								Entry={entry}
								DeleteEntry={deleteEntry}
								EditEntry={editEntry}
								EditTags={editTags}
								EditFolder={editFolder}
								Folders={folders}
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
