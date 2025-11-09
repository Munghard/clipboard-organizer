// ClipboardContext.js
import { createContext, useState, useContext, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";
import { UserContext } from "./UserContext";


export const ClipboardContext = createContext();

export function ClipboardProvider({ children }) {
	const [entries, setEntries] = useState([]);
	// CLIPBOARD
	const [clipboardData, setClipboardData] = useState('');
	const [clipboardFolder, setClipboardFolder] = useState(null);

	const { userId } = useContext(UserContext);

	const createNewEntryFromClipboard = async () => {
		try {
			const text = await navigator.clipboard.readText();
			if (text) {
				// create entry
				setClipboardFolder(null);
				setClipboardData(text);
				addEntry(text);
			}
		} catch (err) {
			console.error('Failed to read clipboard', err);
		}
	};

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

	const SelectTag = (tag, entry) => {
		const entryTags = entry.entry_tags || []; // array of {id, name}
		const exists = entryTags.some(t => t.id === tag.id);
		const newTags = exists
			? entryTags.filter(t => t.id !== tag.id) // remove
			: [...entryTags, { id: tag.id, name: tag.name }]; // add

		editEntryTags(entry.id, newTags);
	};

	const SelectedTags = (id) => {
		let entry = entries.find(e => e.id === id);
		return (entry?.entry_tags || []).map(t => t.id)
	};

	// this was eventhandler for import button
	const handleClick = () => {
		fileInputRef.current.click(); // trigger file picker
	};
	// this is ref for import button
	const fileInputRef = useRef(null);



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
			folder_id: clipboardFolder || null,
			user_id: userId,
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


	// Delete an entry
	const deleteEntry = async (id) => {
		// 1. Remove locally
		setEntries(prev => prev.filter(e => e.id !== id));

		try {
			// 2. Delete related entry_tags first
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
			// move to correct context
			setEntries([]);

		} catch (err) {
			console.error('Error clearing all data:', err);
		}
	};



	const HandleChangeFolder = async (id, folder_id) => {
		if (folder_id === "") folder_id = null;
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
			setEntries(prevEntries); // rollback on error
			return;
		}

		// Update localStorage
		const updatedEntry = updatedEntries.find(e => e.id === id);
		localStorage.setItem(id, JSON.stringify(updatedEntry));
	};


	useEffect(() => {
		const fetchData = async () => {
			if (userId == null) return;
			// Fetch entries from supabase with userid
			const { data: entriesData, error: entriesError } = await supabase
				.from('entries')
				.select(`*, entry_tags(tags(id,name))`)
				.eq('user_id', userId)
				.order('created_at', { ascending: false });

			// Normalize nested data (probably not needed)
			const normalizedEntries = entriesData.map(entry => ({
				...entry,
				entry_tags: (entry.entry_tags || []).map(et => {
					if (et.tags) return { id: et.tags.id, name: et.tags.name };
					return et; // fallback if already flat
				})
			}));

			if (entriesError) console.error(entriesError);
			else setEntries(normalizedEntries);
		};
		fetchData();
	}, [userId]);


	return (
		<ClipboardContext.Provider value={{
			entries, setEntries,
			createNewEntryFromClipboard,
			clipboardData, setClipboardData,
			clipboardFolder, setClipboardFolder,
			importData, exportData,
			addEntry, editEntryContent,
			editEntryTags,
			deleteEntry, clearAll,
			handleClick, handleFileChange,
			fileInputRef,
			SelectTag, SelectedTags,
			HandleChangeFolder,
		}}>
			{children}
		</ClipboardContext.Provider>
	);
}

export function useClipboard() {
	return useContext(ClipboardContext);
}
