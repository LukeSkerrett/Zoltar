const VOLUME_SRC_ON = './assets/images/volume_on.svg';
const VOLUME_SRC_OFF = './assets/images/volume_off.svg';
const DEFAULT_SETTINGS = {
	isVolumeOn: true,
};
let dom = {};
export const settings = {
	isVolumeOn: true,
};
const state = {
	isTicketDisplayed: false,
	isSettingsOpen: false,
	ticketOpened: null,
};

let controls;

export function setControls(passedControls) {
	controls = passedControls;
}

/**
 * Updates display of settings menu to match current settings
 * @param none
 */
function refreshSettingsMenu() {
	dom.volume.src = settings.isVolumeOn ? VOLUME_SRC_OFF : VOLUME_SRC_ON;
} /* refreshSettingsMenu */

/**
 * Saves current settings to local storage
 * @param none
 */
function putSettingsLocalStorage() {
	localStorage.setItem('settings', JSON.stringify(settings));
} /* putSettingsLocalStorage */

/**
 * Sets current settings to settings saved in local storage
 * @param none
 */
function getSettingsLocalStorage() {
	const newSettings = JSON.parse(localStorage.getItem('settings')) || DEFAULT_SETTINGS;
	Object.entries(newSettings).forEach(([key, val]) => {
		settings[key] = val;
	});
	refreshSettingsMenu();
} /* getSettingsLocalStorage */

/**
 * Toggles mute on / off and saves state to localStorage
 * @param none
 */
function toggleMute() {
	settings.isVolumeOn = !settings.isVolumeOn;
	putSettingsLocalStorage();
	refreshSettingsMenu();
} /* toggleMute */

/**
 * Opens and closes the settings buttons container
 * @param none
 */
function toggleSettingsContainer() {
	state.isSettingsOpen = !state.isSettingsOpen;
	dom.settingsButton.classList.toggle('clicked');
	dom.subSettingsBtn.classList.toggle('settings-opacity');
	dom.subSettingsBtn.classList.toggle('settings-slide-in');
} /* toggleSettingsContainer */

/**
 * Closes every instance of a settings Tickets
 * @param none
 */
function closeAllSettingsTickets() {
	if (!state.isTicketDisplayed) return;
	dom.settingsTickets.forEach((ticket) => {
		ticket.classList.add('hidden');
	});
	state.isTicketDisplayed = false;
	state.ticketOpened = null;
	controls.API.enabled = true;
	dom.ticketCount.classList.remove('hidden');
} /* closeAllSettingsTickets */

/**
 * Displays desired settings ticket
 * @param {Object} ticket settings ticket to open
 */
function displaySettingsTicket(ticket) {
	ticket.classList.remove('hidden');
	state.isTicketDisplayed = true;
	state.ticketOpened = ticket;
	controls.API.enabled = false;
	dom.ticketCount.classList.add('hidden');
} /* displaySettingsTicket */

/**
 * Handles opening and closing settings menu tickets
 * @param {Object} ticket settings ticket to open/close
 */
function settingsTicketHandler(ticket) {
	if (!state.isTicketDisplayed) {
		displaySettingsTicket(ticket);
		return;
	}
	if (ticket === state.ticketOpened) {
		closeAllSettingsTickets();
		return;
	}
	closeAllSettingsTickets();
	displaySettingsTicket(ticket);
} /* settingsTicketHandler */

/**
 * Handles keydown event listener for setttings. Closes currently open settings tickets
 * or menu if any exist on 'escape' keypress.
 * @param event
 */
function handleKeydown(event) {
	if (event.key === 'Escape') {
		if (state.isTicketDisplayed) {
			closeAllSettingsTickets();
		} else if (state.isSettingsOpen && dom.cover.classList.contains('hidden')) {
			toggleSettingsContainer();
		}
	}
} /* handleEscape */

function init() {
	dom = {
		settings: document.querySelector('.settings-menu-container'),
		settingsButton: document.querySelector('.settings-menu-button img'),
		volume: document.querySelector('.volume'),
		exitButton: document.querySelector('.exit-zoltar'),
		subSettingsBtn: document.querySelector('.settings-menu-settings'),
		closeTicket: document.querySelectorAll('.close-settings-ticket'),
		creditsButton: document.querySelector('.credits-button'),
		creditsTicket: document.querySelector('.credits'),
		instructionsButton: document.querySelector('.instructions-button'),
		instructionsTicket: document.querySelector('.instructions'),
		ticketCount: document.querySelector('.count-tickets-icon'),
		cover: document.querySelector('.cover'),
		settingsTickets: document.querySelectorAll('.settings-ticket'),
	};
	dom.instructionsButton.addEventListener('click', () => { settingsTicketHandler(dom.instructionsTicket); });
	dom.creditsButton.addEventListener('click', () => {	settingsTicketHandler(dom.creditsTicket); });
	dom.closeTicket.forEach((button) => { button.addEventListener('click', closeAllSettingsTickets); });
	window.addEventListener('keydown', handleKeydown);

	// eslint-disable-next-line no-restricted-globals
	dom.exitButton.addEventListener('click', location.reload.bind(location));
	dom.settingsButton.addEventListener('click', toggleSettingsContainer);
	dom.volume.addEventListener('click', toggleMute);

	getSettingsLocalStorage();
} /* init */
document.addEventListener('DOMContentLoaded', init);
