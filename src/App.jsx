import { useState, useEffect, useRef } from 'react';
import './App.css';
import Entry from './Entry';
import { AnimatePresence, motion } from 'framer-motion';
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
	import.meta.env.VITE_SUPABASE_URL,
	import.meta.env.VITE_SUPABASE_ANON_KEY
);

function App() {
	// Load folders, tags and entries from localStorage on mount
	const [entries, setEntries] = useState([]);
	const [folders, setFolders] = useState([]);
	const [tags, setTags] = useState([]);

	// this has to be above useEffect because its used in the dependency array to make the override work, it reruns when newclipboardvisible changes
	const [newClipboardVisible, setNewClipboardVisible] = useState(false);

	useEffect(() => {
		const handlePasteShortcut = (e) => {
			if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
				if(newClipboardVisible)
				{
					return;
				}
				e.preventDefault(); // optional: prevent default paste if needed
				createNewEntryFromClipboard();
			}
		};

		document.addEventListener('keydown', handlePasteShortcut);

		return () => {
			document.removeEventListener('keydown', handlePasteShortcut);
		};
	}, [newClipboardVisible]);

	const createNewEntryFromClipboard = async () => {
		try {
			const text = await navigator.clipboard.readText();
			if (text) {
				// create your entry here
				setClipboardFolder(null);
				setClipboardData(text);
				addEntry(text);
			}
		} catch (err) {
			console.error('Failed to read clipboard', err);
		}
	};


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
			setAvatarUrl(user.user_metadata.avatar_url);
			setUserId(user.id);
			const userId = user.id;


			if (userId == null) return;
			// Fetch entries
			const { data: entriesData, error: entriesError } = await supabase
				.from('entries')
				.select(`*, entry_tags(tags(id,name))`)
				.eq('user_id', userId)
				.order('created_at', { ascending: false });

			const normalizedEntries = entriesData.map(entry => ({
				...entry,
				entry_tags: (entry.entry_tags || []).map(et => {
					if (et.tags) return { id: et.tags.id, name: et.tags.name };
					return et; // fallback if already flat
				})
			}));

			if (entriesError) console.error(entriesError);
			else setEntries(normalizedEntries);



			// Fetch folders
			const { data: foldersData, error: foldersError } = await supabase
				.from('folders')
				.select('*')
				.eq('user_id', userId);
			if (foldersError) console.error(foldersError);
			else setFolders(foldersData);

			// Fetch tags
			const { data: tagsData, error: tagsError } = await supabase
				.from('tags')
				.select('*')
				.eq('user_id', userId);
			if (tagsError) console.error(tagsError);
			else {
				setTags(tagsData);
			}
		};
		fetchData();
	}, []);

	const signInWithGoogle = async () => {
		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo: window.location.origin + '/clipboard-organizer/',
			},
		});

		if (error) console.error('Login error:', error);
	};
	const signInOut = async () => {
		const { error } = await supabase.auth.signOut();
		if (error) console.error('Logout error:', error);
		else {
			setUserId(null);
			setUserName(null);
			setEntries([]);
			setFolders([]);
			setTags([]);
		}
	}

	// USER
	const [userName, setUserName] = useState(null);
	const [userId, setUserId] = useState(null);
	const [avatarUrl, setAvatarUrl] = useState(null);


	// CLIPBOARD
	const [clipboardData, setClipboardData] = useState('');
	
	const [clipboardFolder, setClipboardFolder] = useState(null);
	
	
	// HAMBURGER MENU
	const [showExtras, setShowExtras] = useState(false);
	
	// ???
	const fileInputRef = useRef(null);
	
	
	// FOLDERS
	const [activeFolder, setActiveFolder] = useState('');
	const [editFolder, setEditFolder] = useState(false);
	const [newFolderName, setNewFolderName] = useState('');
	const [showFolders, setShowFolders] = useState(false);
	const [openEditFolder, setOpenEditFolder] = useState(false);
	const [editableFolder, setEditableFolder] = useState(null);
	
	// TAGS
	const [activeTag, setActiveTag] = useState('');
	const [editTags, setEditTags] = useState(false);
	const [newTagName, setNewTagName] = useState('');
	const [showTags, setShowTags] = useState(false);
	const [openEditTag, setOpenEditTag] = useState(false);
	const [editableTag, setEditableTag] = useState(null);




	const exportData = async () => {
		try {
			const { data: entries, error: entriesError } = await supabase.from('entries').select('*');
			const { data: folders, error: foldersError } = await supabase.from('folders').select('*');
			const { data: tags, error: tagsError } = await supabase.from('tags').select('*');
			const { data: entryTags, error: entryTagsError } = await supabase.from('entry_tags').select('*');

			if (entriesError || foldersError || tagsError || entryTagsError) {
				throw new Error('Error fetching data for export');
			}

			const exportObj = { entries, folders, tags, entry_tags: entryTags };

			const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
			const url = URL.createObjectURL(blob);

			const a = document.createElement('a');
			a.href = url;
			a.download = 'clipboard-export.json';
			a.click();
			URL.revokeObjectURL(url);

		} catch (err) {
			console.error('Failed to export data:', err);
		}
	};


	const importData = async (file) => {
		const reader = new FileReader();
		reader.onload = async (e) => {
			try {
				const imported = JSON.parse(e.target.result);
				const { folders, tags, entries, entry_tags } = imported;

				// 1. Insert folders
				if (folders?.length) await supabase.from('folders').insert(folders);

				// 2. Insert tags
				if (tags?.length) await supabase.from('tags').insert(tags);

				// 3. Insert entries
				if (entries?.length) await supabase.from('entries').insert(entries);

				// 4. Insert entry_tags
				if (entry_tags?.length) await supabase.from('entry_tags').insert(entry_tags);

				// 5. Optionally reload state
				const { data: freshEntries } = await supabase.from('entries').select('*, entry_tags(tags(id,name))');
				setEntries(freshEntries || []);

			} catch (err) {
				console.error('Failed to import data:', err);
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
	const addEntry = async (text) => {

		if (userId == "") {
			console.log("Not logged in.")
			return;
		}

		const newEntry = {
			content: text,
			folder_id: clipboardFolder?.id || null,
		};

		const { data, error } = await supabase
			.from('entries')
			.insert(newEntry)
			.select();

		if (error) {
			console.error("shit the bed:", error);
			return;
		}


		setEntries(prevEntries => [data[0], ...prevEntries]);
		setClipboardData('');
		setClipboardFolder('');
		setNewClipboardVisible(false);
	};

	// Edit an entry
	const editEntryContent = async (id, newContent) => {
		// 1. Update only entry_tags in local state
		setEntries(entries.map(e =>
			e.id === id ? { ...e, content: newContent } : e
		));

		// 2. Update entry content
		const { error } = await supabase
			.from('entries')
			.update({ content: newContent })
			.eq('id', id);
		if (error) console.error('Error updating entry:', error);

	};

	const editEntryTags = (id, tags) => {
		// 1. Update local state immediately
		setEntries(entries.map(e =>
			e.id === id ? { ...e, entry_tags: tags } : e
		));

		// 2. Async DB update (fire and forget)
		(async () => {
			await supabase.from('entry_tags').delete().eq('entry_id', id);

			if (tags.length > 0) {
				const tagInserts = tags
					.filter(t => t?.id != null)
					.map(t => ({ entry_id: id, tag_id: t.id }));

				if (tagInserts.length > 0) {
					const { error } = await supabase.from('entry_tags').insert(tagInserts);
					if (error) console.error('Error updating entry tags:', error);
				}
			}
		})();
	};


	const HandleChangeFolder = async (id, folder_id) => {
		// Update local state
		const prevEntries = [...entries];
		const updatedEntries = entries.map(e =>
			e.id === id ? { ...e, folder_id: folder_id } : e
		);
		setEntries(updatedEntries);

		// Update in Supabase
		const { error } = await supabase
			.from('entries')
			.update({ folder_id: folder_id })
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
	const deleteEntry = async (id) => {
		// 1. Remove locally
		setEntries(prev => prev.filter(e => e.id !== id));

		try {
			// 2. Delete related tags first
			const { error: tagsError } = await supabase
				.from('entry_tags')
				.delete()
				.eq('entry_id', id);

			if (tagsError) throw tagsError;

			// 3. Delete entry
			const { error: entryError } = await supabase
				.from('entries')
				.delete()
				.eq('id', id);

			if (entryError) throw entryError;

		} catch (err) {
			console.error('Error deleting entry:', err);
		}
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

		// Update state 
		setFolders([...folders, data[0]]);
	};

	const UpdateFolderName = async (id, value) => {
		// handle database
		const { error } = await supabase
			.from('folders')
			.update({ "name": value })
			.eq("id", id);
		if (error) console.error('Error updating folder:,error');

		// handle state
		const newFolders = folders.map(f => f.id === id ? { ...f, name: value } : f);
		setFolders(newFolders);
	}
	// Delete a folder
	const deleteFolder = async (folderId) => {
		// Remove from state
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
	};
	// Update tag name
	const UpdateTagName = async (id, value) => {
		// handle database
		const { error } = await supabase
			.from('tags')
			.update({ "name": value })
			.eq("id", id);
		if (error) console.error('Error updating tag:,error');

		// handle state
		const newTags = tags.map(f => f.id === id ? { ...f, name: value } : f);
		setTags(newTags);
	}
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

	};


	const clearAll = async () => {
		if (!window.confirm('Are you sure? This will clear all data!')) return;

		try {
			// 1. Delete all entry_tags first (foreign key constraint)
			let { error } = await supabase.from('entry_tags').delete().neq('entry_id', null);
			if (error) throw error;

			// 2. Delete all entries
			({ error } = await supabase.from('entries').delete().neq('id', null));
			if (error) throw error;

			// 3. Delete all folders
			({ error } = await supabase.from('folders').delete().neq('id', null));
			if (error) throw error;

			// 4. Delete all tags
			({ error } = await supabase.from('tags').delete().neq('id', null));
			if (error) throw error;

			// 5. Clear local state
			setEntries([]);
			setFolders([]);
			setTags([]);

		} catch (err) {
			console.error('Error clearing all data:', err);
		}
	};

	
	// filter displayed entries
	const displayedEntries = entries.filter(e =>
		(!activeFolder || e.folder_id === activeFolder) &&
		(!activeTag || e.entry_tags?.some(t => t.id === activeTag))
	);


	// --- JSX ---
	return (
		<div className="container">
			{/* {!userId && signInWithGoogle()}  */}
			<div className='flex  mb-2'>
				<div className='flex'>

					<p className="text-5xl text-zinc-400 mb-6 font-semibold ">Pasteboard</p>
					<i className='fa fa-copy text-3xl text-zinc-600'></i>
				</div>
				<div className='flex ms-auto'>
					{userId &&
						<div className='flex gap-2'>
							<p className='text-sm font-bold hidden lg:block md:block text-green-500 h-fit'>Logged in as: {userName}</p>
							<img className='h-12 w-12 rounded-4xl lg:ms-auto md:ms-auto border-2 border-green-500' src={avatarUrl}></img>
						</div>
					}
					{!userId && <p className='text-sm font-bold text-red-500'>Log in to use the app</p>}
				</div>
			</div>

			{/*TOP BUTTONS */}
			<div className="flex flex-wrap gap-2 mb-4">
				{userId &&
					<>
						<button
							className="button button-primary"
							onClick={() => setNewClipboardVisible(!newClipboardVisible)}>
							<i className='fa fa-pen'></i> New board
						</button>
						<div>

							<button
								className="button button-warning !border-r-0 !rounded-tr-none !rounded-br-none"
								onClick={() => setEditFolder(!editFolder)}>
								<i className='fa fa-folder'></i> Edit folders
							</button>
							<button
								className="button button-warning !border-l-0 !rounded-tl-none !rounded-bl-none !bg-yellow-800/80"
								onClick={() => { setShowFolders(!showFolders); }}>
								<i className='fa fa-eye'></i>
							</button>
						</div>

						<div>
							<button
								className="button button-tags !border-r-0 !rounded-tr-none !rounded-br-none"
								onClick={() => setEditTags(!editTags)}>
								<i className='fa fa-tag'></i> Edit tags
							</button>

							<button
								className="button button-tags !border-l-0 !rounded-tl-none !rounded-bl-none !bg-purple-800/80"
								onClick={() => { setShowTags(!showTags) }}>
								<i className='fa fa-eye'></i>
							</button>
						</div>
					</>
				}
				<div className='lg:ms-auto flex gap-2'>
					<AnimatePresence>
						{showExtras &&
							<motion.div
								initial={{ scaleX: 0 }}
								animate={{ scaleX: 1 }}
								transition={{ duration: 0.2 }}
								exit={{ scaleX: 0 }}
								className='flex flex-wrap gap-2 origin-right'>
								{userId &&
									<>
										<button className="button button-danger" onClick={clearAll}>
											<i className='fa fa-trash'></i> Clear all
										</button>
										<button
											className="button button-secondary"
											onClick={() => exportData()}
										>
											<i className='fa fa-download'></i> Export
										</button>

										<button onClick={handleClick} className="button button-secondary">
											<i className='fa fa-folder-open'></i> Import
										</button>
									</>

								}
								{!userId &&
									<button onClick={signInWithGoogle} className="button button-success">
										<i className='fa-brands fa-google text-green-400' ></i> Sign in
									</button>
								}
								{userId &&
									<button onClick={signInOut} className="button button-secondary">
										<i className='fa fa-sign-out-alt' ></i> Sign out
									</button>
								}
							</motion.div>
						}
					</AnimatePresence>
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
			
			{/* NEW CLIPBOARD */}
			{newClipboardVisible && (
				<div className="mb-4 max-w-xl">
					<textarea
						placeholder="Clipboard content"
						value={clipboardData}
						onChange={(e) => setClipboardData(e.target.value)}
						className="w-full mb-2 p-2 border rounded bg-zinc-950"
						rows={3}
					/>
					<select
						value={clipboardFolder || ""}
						onChange={(e) => setClipboardFolder(e.target.value)}
						className="mb-2 p-2 border rounded bg-zinc-950"
					>
						<option value="">{"All"} </option>
						{folders.map((folder) => (
							<option key={folder.id} value={folder.id}>
								{folder.name}
							</option>
						))}
					</select>
					<button className="button button-success ms-2" onClick={() => addEntry(clipboardData)}>
						<i className='fa fa-save'></i> Save
					</button>
				</div>
			)}
			

			{openEditTag &&
				<>
					<div className='bg-zinc-950 p-4 flex flex-col rounded-2xl border-zinc-800 border-2 w-fit'>
						<p className='m-0 text-xl text-zinc-400'>Edit tag name:</p>
						<input
							className=" rounded !text-xl text-white border-none outline-none font-sans font-inherit"
							value={editableTag.name}
							onChange={(e) => setEditableTag(prev => ({ ...prev, name: e.target.value }))}
							onBlur={(e) => {
								UpdateTagName(editableTag.id, e.target.value);
								setOpenEditTag(false);
							}}
							onKeyDown={(e) => {
								if (e.key == "Enter") {
									UpdateTagName(editableTag.id, e.target.value);
									setOpenEditTag(false);
								}
							}}
							autoFocus
						/>
						<p className='mt-2 text-zinc-500'>Enter to save.</p>
					</div>

				</>
			}
			{/* SET TAG */}
			{showTags &&
				<>
					<p className='text-md text-purple-600 m-0 py-1'>Tags:</p>
					<div className={`flex flex-wrap ${ editTags ?"gap-3":"gap-2"} mb-4`}>
						<button className="button button-secondary" onClick={() => { setActiveTag('');}}>
							All
						</button>
						{tags.map((tag, index) => (
							<div key={tag.id} className="flex gap-1">
								<button className={`button ${activeTag === tag.id ? 'button-success': 'button-tags'}`} onClick={(e) => { e.stopPropagation(); setActiveTag(tag.id); }}>
									{tag.name}
								</button>
								{editTags &&
									<>
										<button className="button button-secondary" onClick={() => { setOpenEditTag(true); setEditableTag(tag); }}>
											<i className="fa fa-pen"></i>
										</button>
										<button className="button button-danger" onClick={() => RemoveTag(tag.id)}>
											<i className="fa fa-trash"></i>
										</button>
									</>
								}
							</div>
						))}
					</div>
				</>
			}
			{/* EDIT TAGS */}
			{editTags &&
				<div className="flex gap-2 mb-4 items-center">
					<input
						type="text"
						placeholder="New tag name"
						value={newTagName}
						onChange={(e) => setNewTagName(e.target.value)}
						onKeyDown={(k) => {
							if (k.key === "Enter" && newTagName.trim() !== "") {
								AddTag(newTagName);
								setNewTagName("");
							}
						}}
						className="p-2 border rounded bg-zinc-950"
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
			
			{openEditFolder &&
				<>
					<div className='bg-zinc-950 p-4 flex flex-col rounded-2xl border-zinc-800 border-2 w-fit'>
						<p className='m-0 text-xl text-zinc-400'>Edit folder name:</p>
						<input
							className=" rounded !text-xl text-white border-none outline-none font-sans font-inherit"
							value={editableFolder.name}
							onChange={(e) => setEditableFolder(prev => ({ ...prev, name: e.target.value }))}
							onBlur={(e) => {
								UpdateFolderName(editableFolder.id, e.target.value);
								setOpenEditFolder(false);
							}}
							onKeyDown={(e) => {
								if (e.key == "Enter") {
									UpdateFolderName(editableFolder.id, e.target.value);
									setOpenEditFolder(false);
								}
							}}
							autoFocus
						/>
						<p className='mt-2 text-zinc-500'>Enter to save.</p>
					</div>

				</>
			}
			{showFolders &&
				<>
					{/* SET FOLDER */}
					<p className='text-md text-yellow-600 m-0 py-1'>Folders:</p>
					<div className={`flex flex-wrap ${ editFolder ?"gap-3":"gap-2"} mb-4`}>
						<button className="button button-secondary" onClick={() => { setActiveFolder(''); setClipboardFolder("") }}>
							All
						</button>
						{folders.map((folder, index) => (
							<div key={folder.id} className="flex gap-1">
								<div className='flex gap-1'>
									<button className={`button ${activeFolder === folder.id ? 'button-success': 'button-warning'}`} onClick={() => { !openEditFolder && setActiveFolder(folder.id); setClipboardFolder(folder.id) }}>
										<>{folder.name}</>
									</button>
									{editFolder &&
										<>
											<button className="button button-secondary" onClick={() => { setOpenEditFolder(true); setEditableFolder(folder); }}>
												<i className="fa fa-pen"></i>
											</button>
											<button className="button button-danger" onClick={() => deleteFolder(folder.id)}>
												<i className="fa fa-trash"></i>
											</button>
										</>
									}
								</div>
							</div>
						))}
					</div>
				</>
			}
			{/* EDIT FOLDER */}
			{editFolder &&
				<div className="flex gap-2 mb-4 items-center">
					<input
						type="text"
						placeholder="New folder name"
						value={newFolderName}
						onKeyDown={(k) => {
							if (k.key === "Enter" && newFolderName.trim() !== "") {
								addFolder(newFolderName);
								setNewFolderName("");
							}
						}}
						onChange={(e) => setNewFolderName(e.target.value)}
						className="p-2 border rounded bg-zinc-950"
					/>
					<button
						className="button button-success"
						onClick={() => {
							addFolder(newFolderName);
							setNewFolderName("");
						}}>
						<i className='fa fa-add'></i> Add Folder
					</button>
				</div>
			}
			{userId &&
				<>

					<p className='text-md text-gray-400'>Folder: {folders.find(f => f.id === activeFolder)?.name || "All"}, Tag: {tags.find(t => t.id === activeTag)?.name || 'All'}, Double click to open</p>
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
										EditEntryContent={editEntryContent}
										EditEntryTags={editEntryTags}
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
				</>
			}
		</div>

	);
}

export default App;
