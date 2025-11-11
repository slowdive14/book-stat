import { App, Plugin, WorkspaceLeaf, ItemView, TFile, moment } from 'obsidian';

const VIEW_TYPE_DAILY_COMPARISON = "daily-note-comparison-view";

export default class DailyNoteComparisonPlugin extends Plugin {
	async onload() {
		console.log('Loading Daily Note Comparison Plugin');

		// Register the custom view
		this.registerView(
			VIEW_TYPE_DAILY_COMPARISON,
			(leaf) => new DailyComparisonView(leaf)
		);

		// Add ribbon icon
		this.addRibbonIcon('calendar-days', 'Compare Daily Notes', () => {
			this.activateView();
		});

		// Add command
		this.addCommand({
			id: 'open-daily-comparison',
			name: 'Open Daily Note Comparison',
			callback: () => {
				this.activateView();
			}
		});
	}

	async activateView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_DAILY_COMPARISON);

		if (leaves.length > 0) {
			// View already exists, just reveal it
			leaf = leaves[0];
		} else {
			// Create new leaf in right sidebar
			leaf = workspace.getRightLeaf(false);
			await leaf?.setViewState({
				type: VIEW_TYPE_DAILY_COMPARISON,
				active: true,
			});
		}

		// Reveal the leaf
		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}

	onunload() {
		console.log('Unloading Daily Note Comparison Plugin');
	}
}

class DailyComparisonView extends ItemView {
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType(): string {
		return VIEW_TYPE_DAILY_COMPARISON;
	}

	getDisplayText(): string {
		return "Daily Note Comparison";
	}

	getIcon(): string {
		return "calendar-days";
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();
		container.addClass('daily-comparison-view');

		// Add title
		const title = container.createEl('h4', {
			text: 'Daily Notes - Same Day Across Years',
			cls: 'daily-comparison-title'
		});

		// Get today's date
		const today = moment();
		const month = today.format('MM');
		const day = today.format('DD');

		// Create container for the three years
		const yearsContainer = container.createEl('div', {
			cls: 'daily-comparison-years'
		});

		// Years to compare
		const years = [2025, 2024, 2023];

		for (const year of years) {
			await this.renderYearSection(yearsContainer, year, month, day);
		}

		// Add styles
		this.addStyles();
	}

	async renderYearSection(container: HTMLElement, year: number, month: string, day: string) {
		const yearSection = container.createEl('div', {
			cls: 'daily-comparison-year-section'
		});

		// Year header
		const yearHeader = yearSection.createEl('div', {
			cls: 'daily-comparison-year-header'
		});
		yearHeader.createEl('h5', { text: `${year}-${month}-${day}` });

		// Content area
		const contentArea = yearSection.createEl('div', {
			cls: 'daily-comparison-content'
		});

		// Try different common daily note formats
		const possiblePaths = [
			`${year}-${month}-${day}.md`,
			`Daily Notes/${year}-${month}-${day}.md`,
			`Journal/${year}-${month}-${day}.md`,
			`${year}/${year}-${month}-${day}.md`,
			`${year}/${month}/${year}-${month}-${day}.md`,
		];

		let file: TFile | null = null;
		for (const path of possiblePaths) {
			const f = this.app.vault.getAbstractFileByPath(path);
			if (f instanceof TFile) {
				file = f;
				break;
			}
		}

		if (file) {
			// Read and display the file content
			const content = await this.app.vault.read(file);
			const fileToOpen = file; // Capture for closure

			// Create a clickable link to open the note
			const linkButton = yearHeader.createEl('button', {
				text: '📖 Open',
				cls: 'daily-comparison-open-btn'
			});
			linkButton.addEventListener('click', () => {
				this.app.workspace.getLeaf().openFile(fileToOpen);
			});

			// Display preview of content
			const preview = contentArea.createEl('div', {
				cls: 'daily-comparison-preview'
			});

			// Render markdown
			await this.renderMarkdown(content, preview, file.path);
		} else {
			contentArea.createEl('p', {
				text: 'No daily note found for this date',
				cls: 'daily-comparison-no-note'
			});
		}
	}

	async renderMarkdown(markdown: string, el: HTMLElement, sourcePath: string) {
		await (this.app as any).markdown.renderer.render(
			markdown,
			el,
			sourcePath,
			this
		);
	}

	addStyles() {
		const style = document.createElement('style');
		style.textContent = `
			.daily-comparison-view {
				padding: 10px;
				height: 100%;
				overflow-y: auto;
			}

			.daily-comparison-title {
				margin-bottom: 15px;
				color: var(--text-normal);
				border-bottom: 2px solid var(--background-modifier-border);
				padding-bottom: 8px;
			}

			.daily-comparison-years {
				display: flex;
				flex-direction: column;
				gap: 15px;
			}

			.daily-comparison-year-section {
				border: 1px solid var(--background-modifier-border);
				border-radius: 8px;
				padding: 10px;
				background: var(--background-secondary);
			}

			.daily-comparison-year-header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-bottom: 10px;
				padding-bottom: 8px;
				border-bottom: 1px solid var(--background-modifier-border);
			}

			.daily-comparison-year-header h5 {
				margin: 0;
				color: var(--text-accent);
				font-weight: 600;
			}

			.daily-comparison-open-btn {
				padding: 4px 12px;
				background: var(--interactive-accent);
				color: var(--text-on-accent);
				border: none;
				border-radius: 4px;
				cursor: pointer;
				font-size: 12px;
			}

			.daily-comparison-open-btn:hover {
				background: var(--interactive-accent-hover);
			}

			.daily-comparison-content {
				max-height: 300px;
				overflow-y: auto;
				padding: 8px;
				background: var(--background-primary);
				border-radius: 4px;
			}

			.daily-comparison-preview {
				font-size: 0.9em;
				line-height: 1.6;
			}

			.daily-comparison-no-note {
				color: var(--text-muted);
				font-style: italic;
				text-align: center;
				padding: 20px;
			}
		`;
		document.head.appendChild(style);
	}

	async onClose() {
		// Cleanup if needed
	}
}
