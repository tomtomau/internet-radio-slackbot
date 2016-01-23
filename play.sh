#!/bin/sh
cvlc --alsa-audio-device default $1 --volume 350 --speex-resampler-quality=10 --src-converter-type=1 --pidfile /tmp/vlc.pid -d
