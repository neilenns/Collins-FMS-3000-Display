# Collins FMS 3000 display

This app displays the current content of the Collins FMS 3000 display in the Working Title CJ4 in
Microsoft Flight Simulator 2020. It's handy for breaking out the window on your custom-built FMS
that's running MobiFlight to handle the key input.

This project leans heavily on [the code written by dementedmonkey](https://github.com/dementedmonkey/cj4-mcdu).
Their work to create a React app that can remotely display the contents of the screen was what made this little
project possible.

## Setup

To make this work:

1. Install [MSFS2020 AAU1 beta](https://forums.flightsimulator.com/t/read-first-welcome-to-the-aau-i-beta/562534) or newer
2. Download the latest [CJ4 MCDU release](https://github.com/dementedmonkey/cj4-mcdu/releases) from
dementedmonkey and copy the `z-dementedmonkey-cj4-mcdu` folder to your Flight Simulator `community` folder.
3. Download and run the installer for this app from the [releases page](https://github.com/neilenns/Collins-FMS-3000-Display/releases).
4. Run Microsoft Flight Simulator and start a flight with the CJ4.

Two windows will pop up, one for the pilot's display and one for the co-pilot's display. Once the plane has loaded and is powered on the app will update to display the screen contents. Use the `F11` key on your keyboard to toggle full screen display.
