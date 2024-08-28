import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: 'lay-on-canvas',
			name: 'Lay Matching Notes on Canvas',
			callback: () => this.layOnCanvas(),
		});

	}

	async layOnCanvas() {
		const query = await this.getUserQuery();
		const files = this.app.vault.getMarkdownFiles();
		const matchingFiles = files.filter(file => this.matchesQuery(file, query));

		if (matchingFiles.length === 0) {
			new Notice('No matching notes found.');
			return;
		}
		else {
			new Notice(`${matchingFiles.length} notes found. E.g. ${matchingFiles[0].path}`);
			console.log(matchingFiles);
		}

		await this.createCanvasWithNotes(matchingFiles);
		new Notice(`${matchingFiles.length} notes added to the canvas.`);
	}

	async createCanvasWithNotes(files: TFile[]) {
		const canvasFile = await this.app.vault.create('New Canvas.canvas', '{"nodes":[],"edges":[]}');
		const leaf = await this.app.workspace.getLeaf(true);
		await leaf.openFile(canvasFile);

		if (leaf.view.getViewType() === 'canvas') {
			console.log("Found canvas view");
			const canvas = leaf.view as any; // Cast to any to bypass type checking
			for (const file of files) {
				canvas.canvas.createFileNode({ file, pos: { x: Math.random() * 1000, y: Math.random() * 1000 } });
			}
		} else {
			new Notice('Failed to open canvas view');
		}
	}

	async getUserQuery(): Promise<string> {
		// Get user input for Regex or tag query
		const query = await new Promise<string>(resolve => {
			new PromptModal(this.app, 'Enter a Regex or tag to match notes:', resolve).open();
		});
		return query.trim();
	}

	matchesQuery(file: TFile, query: string): boolean {
		const regex = new RegExp(query, 'i');
		return regex.test(file.name);
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class PromptModal extends Modal {

	private title: string;
	private onSubmit: (input: string) => void;

	constructor(app: App, title: string, onSubmit: (input: string) => void) {
		super(app);
		this.title = title;
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl('h1', { text: this.title });

		const inputEl = contentEl.createEl('input', { type: 'text' });
		inputEl.focus();

		const submitBtn = contentEl.createEl('button', { text: 'Submit' });
		submitBtn.onclick = () => {
			this.onSubmit(inputEl.value);
			this.close();
		};
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}