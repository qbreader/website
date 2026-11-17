// Admins aren't necessarily paid players, so they can't use the paid results route for the same audio.
// This router is behind the admin check, which requires privileges for the packet.
import audioRouter from '../paid/results/audio.js';

export default audioRouter;
