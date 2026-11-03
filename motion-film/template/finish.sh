#!/bin/sh
# Shutter motion blur in post. The film is a pure function of time, so a 120 fps
# render holds two exact sub-frames per 60 fps frame; averaging each pair is a
# 360° shutter at 60 fps. Audio comes from the current mix, so a remix never
# needs a re-render.
# Usage: ./finish.sh [renders/film-120.mp4] [renders/film.mp4]
set -eu
cd "$(dirname "$0")"
in=${1:-renders/film-120.mp4}
out=${2:-renders/film.mp4}
ffmpeg -v error -y -i "$in" -i assets/audio/mix.wav \
  -map 0:v:0 -map 1:a:0 \
  -vf "tmix=frames=2:weights='1 1',select='not(mod(n\,2))',setpts=N/(60*TB)" \
  -r 60 -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -movflags +faststart \
  -c:a aac -b:a 256k -shortest "$out"
ffprobe -v error -show_entries stream=codec_type,codec_name,r_frame_rate,width,height:format=duration,size -of compact "$out"
