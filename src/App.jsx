import { useState, useEffect, useRef, useContext } from 'react';
import './App.css';
import Entry from './Entry';
import { AnimatePresence, motion } from 'framer-motion';
import ThemeSelector from './ThemeSelector';

import { ClipboardContext } from './ClipBoardContext';
import { FoldersContext } from './FoldersContext';
import { TagsContext } from './TagsContext';
import { UserContext } from './UserContext';


function App() {

	const { entries, setEntries, createNewEntryFromClipboard, clearClipboardData,
		clipboardData, setClipboardData, clipboardFolder, setClipboardFolder,
		importData, exportData, addEntry, editEntryContent, editEntryTags,
		deleteEntry, clearAll, handleClick, handleFileChange, fileInputRef, SelectTag } = useContext(ClipboardContext);

	const { folders, setFolders, activeFolder, setActiveFolder, editFolder,
		setEditFolder, newFolderName, setNewFolderName, showFolders,
		setShowFolders, openEditFolder, setOpenEditFolder, editableFolder,
		setEditableFolder, addFolder, UpdateFolderName, deleteFolder,
		HandleChangeFolder, } = useContext(FoldersContext);

	const { tags, setTags, activeTag, setActiveTag, editTags, setEditTags,
		newTagName, setNewTagName, showTags, setShowTags, openEditTag,
		setOpenEditTag, editableTag, setEditableTag, AddTag, UpdateTagName,
		RemoveTag } = useContext(TagsContext);


	const { userId, userName, avatarUrl, signInWithGoogle, signOut } = useContext(UserContext);

	// this has to be above useEffect because its used in the dependency array to make the override work, it reruns when newclipboardvisible changes
	const [newClipboardVisible, setNewClipboardVisible] = useState(false);
	const [newClipboardPinned, setNewClipboardPinned] = useState(false);

	const handleSignOut = () => {
		signOut();
		setEntries([]);
		setFolders([]);
		setTags([]);
	}

	// useEffect(() => {
	// 	const handlePasteShortcut = (e) => {
	// 		if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
	// 			if (newClipboardVisible) {
	// 				return;
	// 			}
	// 			e.preventDefault(); // prevent default paste if needed
	// 			createNewEntryFromClipboard();
	// 		}
	// 	};

	// 	document.addEventListener('keydown', handlePasteShortcut);

	// 	return () => {
	// 		document.removeEventListener('keydown', handlePasteShortcut);
	// 	};
	// }, [newClipboardVisible]);



	// HAMBURGER MENU
	const [showExtras, setShowExtras] = useState(false);




	// filter displayed entries
	const displayedEntries = entries.filter(e =>
		(!activeFolder || e.folder_id === activeFolder) &&
		(!activeTag || e.entry_tags?.some(t => t.id === activeTag))
	);

	const visibleFolders = activeFolder ? folders.filter(f => f.id === activeFolder) : folders;

	// --- JSX ---
	return (
		<div className="container">
			<motion.div
				layout
				transition={{ duration: 0.6, type: "spring" }}
				className='w-full -z-50 p-3  mb-3'
			>
				{/* {!userId && signInWithGoogle()}  */}
				<div className='flex  mb-2'>
					<div className='flex gap-2 items-center'>
						<p className="text-4xl text-zinc-400 mb-6 font-semibold ">Pasteboard</p>
						<img className='h-fit' src='icon.svg'></img>
						{/* <i className='fa fa-copy text-3xl text-zinc-600'></i> */}
					</div>
					<div className='flex ms-auto'>
						{userId &&
							<div className='flex gap-2'>
								<p className='text-sm font-bold hidden lg:block md:block text-green-500 h-fit'>Logged in as: {userName}</p>
								{avatarUrl && <img src={avatarUrl} className='h-12 w-12 rounded-4xl lg:ms-auto md:ms-auto border-2 border-green-500'></img>}
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
									onClick={() => { setShowFolders(!showFolders); setActiveFolder(''); }}>
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

											{/* <ThemeSelector/> */}
										</>

									}
									{!userId &&
										<button onClick={signInWithGoogle} className="button button-success">
											<i className='fa-brands fa-google text-green-400' ></i> Sign in
										</button>
									}
									{userId &&
										<button onClick={handleSignOut} className="button button-secondary">
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

						<button className="btn btn-sm close" title="Pinned" onClick={() => setNewClipboardPinned(!newClipboardPinned)}>
							<i className={`fa fa-thumbtack ${newClipboardPinned ? 'text-white' : 'text-gray-500'}`}></i>
						</button>


						<button className="button button-success ms-2" onClick={() => { addEntry(clipboardData, newClipboardPinned); setNewClipboardVisible(false); setNewClipboardPinned(false) }}>
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
						<div className={`flex flex-wrap ${editTags ? "gap-3" : "gap-2"} mb-4`}>
							<button className="button button-secondary" onClick={() => { setActiveTag(''); }}>
								All
							</button>
							{tags.map((tag, index) => (
								<div key={tag.id} className="flex gap-1">
									<button className={`button ${activeTag === tag.id ? 'button-success' : 'button-tags'}`} onClick={(e) => { e.stopPropagation(); setActiveTag(tag.id); }}>
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
						<div className={`flex flex-wrap ${editFolder ? "gap-3" : "gap-2"} mb-4`}>
							<button className="button button-secondary" onClick={() => { setActiveFolder(''); setClipboardFolder("") }}>
								All
							</button>
							{folders.map((folder) => (
								<div key={folder.id} className="flex gap-1">
									<div className='flex gap-1'>
										<button
											className={`button ${activeFolder === folder.id ? 'button-success' : 'button-warning'}`}
											onClick={() => { !openEditFolder && setActiveFolder(folder.id); setClipboardFolder(folder.id) }}>
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
			</motion.div>
			{userId &&
				<>
					<p className='text-md text-gray-400'>
						Folder: {folders.find(f => f.id === activeFolder)?.name || "All"},
						Tag: {tags.find(t => t.id === activeTag)?.name || 'All'}, Double click to open
					</p>

					<motion.div className="gap-2">
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

							{showFolders && (
								visibleFolders.map((folder) => (
									<AnimatePresence>
										<motion.div
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											exit={{ opacity: 0 }}
											transition={{ duration: 0.3 }}
											key={folder.id}>
											<div onClick={() => setActiveFolder(folder.id)} className='rounded-tr-2xl gap-2 bg-yellow-900/20 h-fit w-fit mt-4'>
												<p className='text-md px-2 m-0 text-zinc-400 font-bold'>{folder.name}, #{entries.filter(e => e.folder_id === folder.id).length}</p>
											</div>
											<div key={folder.id} className='gap-2 bg-gradient-to-b from-yellow-900/20 to-transparent p-2 rounded-tr-2xl'>

												<div className='grid grid-cols-[repeat(auto-fill,_minmax(300px,_1fr))] gap-2'>
													{entries && displayedEntries
														.filter(e => e.folder_id === folder.id)
														.sort((a, b) => Number(b.pinned) - Number(a.pinned))
														.map((entry) => (
															<motion.div
																className='flex flex-col'
																initial={{ scale: 1, rotate: 0 }}
																exit={{ scale: 0, rotate: 180 }}
																transition={{ duration: 0.2 }}
																layout
																key={entry.id}>
																<Entry entry={entry} />
															</motion.div>
														))}
													{displayedEntries.filter(e => e.folder_id === folder.id).length === 0 && <p className='text-zinc-500'>No clipboards in this folder.</p>}
												</div>
											</div>
										</motion.div>
									</AnimatePresence>
								))
							)}

							{!showFolders &&
								<div className="grid grid-cols-[repeat(auto-fill,_minmax(300px,_1fr))] gap-2">
									{entries && displayedEntries
										.sort((a, b) => Number(b.pinned) - Number(a.pinned))
										.map((entry) => (
											<motion.div
												className="flex flex-col"
												initial={{ scale: 1, rotate: 0 }}
												exit={{ scale: 0, rotate: 180 }}
												transition={{ duration: 0.2 }}
												layout
												key={entry.id}
											>
												<Entry entry={entry} />
											</motion.div>
										))}
								</div>
							}

						</AnimatePresence>
					</motion.div>
				</>

			}
		</div>

	);
}

export default App;
