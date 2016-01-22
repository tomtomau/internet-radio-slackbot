#!/bin/sh
cvlc --alsa-audio-device default http://www.abc.net.au/res/streaming/audio/mp3/triplej.pls --volume 350 --speex-resampler-quality=10 --src-converter-type=1 --pidfile /tmp/vlc.pid -d
