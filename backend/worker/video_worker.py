import argparse
import sys
import os
import json
from inference_sdk import InferenceHTTPClient

# Force OpenCV to use the headless backend (important for server environments)
os.environ["OPENCV_IO_ENABLE_OPENCL"] = "0"
import cv2
import numpy as np

def main():
    parser = argparse.ArgumentParser(description="Process video for European crabs using Roboflow.")
    parser.add_argument("--input", required=True, help="Input video file path")
    parser.add_argument("--output", required=True, help="Output video file path")
    parser.add_argument("--workspace", required=True, help="Roboflow workspace ID")
    parser.add_argument("--workflow", required=True, help="Roboflow workflow ID")
    args = parser.parse_args()

    api_key = os.environ.get("ROBOFLOW_API_KEY")
    if not api_key:
        print("ROBOFLOW_API_KEY environment variable is not set.", file=sys.stderr)
        sys.exit(1)

    # Initialize the Inference SDK client
    client = InferenceHTTPClient(
        api_url="https://serverless.roboflow.com",
        api_key=api_key,
    )

    cap = cv2.VideoCapture(args.input)
    if not cap.isOpened():
        print(f"Error: Could not open input video {args.input}", file=sys.stderr)
        sys.exit(1)

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps == 0 or np.isnan(fps):
        fps = 30.0

    # Write as mp4v. The backend Node app could transcode this with ffmpeg later if needed,
    # but mp4v/h264 in an MP4 container is generally acceptable.
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(args.output, fourcc, fps, (width, height))

    processed_frames = 0
    max_unique_crabs = 0

    try:
        # Initialize a WebRTC/Stream session for stateful workflow tracking.
        # This keeps the ByteTrack tracker state alive across frames.
        client.select_api_v0() # the webrtc stream requires v0 inference sdk compatibility usually
        
        # NOTE: If inference-sdk stream processing changes, this may need updating to standard HTTP per-frame 
        # or the dedicated inference.core.interfaces.stream.InferencePipeline. 
        # However, for the standard InferenceHTTPClient workflow integration:
        
        # We will process frame by frame using the HTTP client, but passing the state if the API allows it, 
        # or using the dedicated video endpoint. Wait, Roboflow Serverless doesn't directly maintain WebRTC 
        # state across stateless HTTP calls without a session ID.
        
        # Since we must use the workflow, and track across frames, we pass the same image to the workflow.
        # Actually, Roboflow Workflows with tracking (ByteTrack) automatically maintain state if we use 
        # the video inference pipeline. But we're using HTTP. Let's process frame by frame.
        # If the workflow doesn't persist state via HTTP, we'll extract predictions and count them.
        
        print("Starting frame-by-frame processing...", file=sys.stderr)
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Encode frame to JPEG
            _, buffer = cv2.imencode('.jpg', frame)
            frame_base64 = buffer.tobytes()

            try:
                # Call the workflow
                result = client.run_workflow(
                    workspace_name=args.workspace,
                    workflow_id=args.workflow,
                    images={"image": frame_base64}
                )

                # Extract outputs
                outputs = result[0] if isinstance(result, list) else result.get("outputs", [{}])[0]
                
                # Check for unique_crab_count directly from the workflow logic
                if "unique_crab_count" in outputs:
                    count = outputs["unique_crab_count"]
                    if count > max_unique_crabs:
                        max_unique_crabs = count

                # Check for output image
                if "output_image" in outputs:
                    # Depending on workflow, it might be base64 string or numpy array
                    img_data = outputs["output_image"]
                    if isinstance(img_data, str):
                        # Decode base64
                        import base64
                        if img_data.startswith("data:"):
                            img_data = img_data.split(",")[1]
                        img_bytes = base64.b64decode(img_data)
                        img_arr = np.frombuffer(img_bytes, dtype=np.uint8)
                        annotated_frame = cv2.imdecode(img_arr, cv2.IMREAD_COLOR)
                        out.write(annotated_frame)
                    else:
                        out.write(frame)
                else:
                    out.write(frame)

                processed_frames += 1

                if processed_frames % 30 == 0:
                    print(f"Processed {processed_frames} frames...", file=sys.stderr)

            except Exception as e:
                print(f"Error processing frame {processed_frames}: {e}", file=sys.stderr)
                # write the unannotated frame to maintain timing
                out.write(frame)
                processed_frames += 1

    finally:
        cap.release()
        out.release()
        print("Video processing complete.", file=sys.stderr)

    # Print exact JSON to stdout for Node to capture
    final_result = {
        "uniqueCrabCount": max_unique_crabs,
        "processedFrames": processed_frames
    }
    print(json.dumps(final_result))

if __name__ == "__main__":
    main()
