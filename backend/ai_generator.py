import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure the generative AI model
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise ValueError("GOOGLE_API_KEY environment variable not set!")
genai.configure(api_key=api_key)

model = genai.GenerativeModel('gemini-2.5-flash')

def create_invitation_html(data: dict) -> str:
    """
    Generates a complete, modern, and beautiful HTML file for a wedding invitation
    by filling a robust template with the provided form data.

    Args:
        data: A dictionary containing the form data from the frontend.

    Returns:
        A string containing the full HTML of the invitation.
    """

    # Define the template as a standard multiline string. No f-string needed.
    # This avoids all curly brace escaping issues.
    prompt_template = """
    You are an expert web designer. Your task is to generate a complete, modern, and beautiful wedding invitation HTML based on the provided wedding details.
    The design, colors, theme, and style should be fully determined by the user's specified Color Theme and Invitation Style. Do not use any fixed or predefined designs; create a custom design that matches the user's preferences.
    Ensure that images, music, and gallery photos are properly included using the provided URLs.
    The final output must be ONLY the complete HTML code, starting with `<!DOCTYPE html>`.

    **Wedding Details:**
    - Slug: [SLUG]
    - Bride's Name: [BRIDE_NAME]
    - Bride's Parents: [BRIDE_PARENTS]
    - Groom's Name: [GROOM_NAME]
    - Groom's Parents: [GROOM_PARENTS]
    - Event Date: [EVENT_DATE]
    - Ceremony Time: [CEREMONY_TIME]
    - Ceremony Location: [CEREMONY_LOCATION]
    - Reception Time: [RECEPTION_TIME]
    - Reception Location: [RECEPTION_LOCATION]
    - Color Theme: [COLOR_THEME]
    - Invitation Style: [INVITATION_STYLE]
    - Religion: [RELIGION]
    - Background Music URL: [MUSIC_URL]
    - Cover Photo URL: [COVER_PHOTO_URL]
    - Bride Photo URL: [BRIDE_PHOTO_URL]
    - Groom Photo URL: [GROOM_PHOTO_URL]
    - Special Notes: [SPECIAL_NOTES]

    **INSTRUCTIONS FOR AI:**
    1. Create a fully custom HTML design based on the Color Theme and Invitation Style. For example, if Color Theme is "Pastel Pink", use soft pinks and whites; if Invitation Style is "Romantic", incorporate floral elements and elegant fonts.
    2. Include essential sections: Cover page, Hero/Introduction, Couple details, Event details with countdown (using [EVENT_DATE_ISO]), Gallery, RSVP form, Comments section, and Footer.
    3. **Google Maps Integration (CRITICAL):** For both Ceremony and Reception locations, you MUST include a "Buka di Google Maps" button or link. Generate the URL using: `https://www.google.com/maps/search/?api=1&query=` followed by the URL-encoded location name.
    4. **Event Timing:** Display the times for Akad/Ceremony ([CEREMONY_TIME]) and Reception ([RECEPTION_TIME]) clearly. If a time is "N/A", omit that specific detail.
    5. Use modern web technologies like Tailwind CSS for styling, and include animations, responsive design, and interactivity.
    6. Replace all placeholders (e.g., [BRIDE_NAME]) with the corresponding wedding details provided.
    7. **Photos and Gallery (CRITICAL):**
        - Use precisely [BRIDE_PHOTO_URL] for the Bride's photo and [GROOM_PHOTO_URL] for the Groom's photo. Do not use dummy images.
        - [GALLERY_PHOTOS_HTML] is already generated - include it in your HTML exactly as provided instead of writing your own gallery images.
        - Set the CSS background image for the cover and hero sections to [COVER_PHOTO_URL]. Use `background-size: cover` to prevent breaking. If not available, fallback to [BACKGROUND_URL].
    8. **Gifts Section:**
        - Show this introductory text above the gift/bank cards: "Your prayers and blessings are a truly meaningful gift to us. And if giving is an expression of love, you can give a cashless gift. Thank you."
        - Directly insert the HTML provided in [HADIAH_HTML] beneath the text. Do NOT alter the layout, classes, or styles of the cards inside [HADIAH_HTML], and do NOT wrap them in any padding or margin containers that would restrict their width.
        - If [HADIAH_HTML] is empty, do not include this gift section at all.
    9. **Guest Personalization (CRITICAL):**
        - On the Cover page, include a section like "Kepada Yth. Bapak/Ibu/Saudara/i:" followed by an element to display the guest name (e.g., `<span id="guest-name-display">Tamu Undangan</span>`).
    10. **RSVP & Guestbook JavaScript Logic (VERY IMPORTANT):**
        - Create one combined section for "RSVP & Ucapan".
        - This section must contain a single form with inputs for `nama` (name), `kehadiran` (attendance status: Hadir/Tidak Hadir), and `ucapan` (message).
        - **IMPORTANT FOR NAME INPUT:** The `nama` input must have the id `rsvp-name`.
        - Create one JavaScript function, for example `loadRsvpMessages()`.
        - **`loadRsvpMessages()` function:**
            - It must perform a `fetch` GET request to `/api/invitations/[SLUG]/rsvp`.
            - The response will be a JSON object like `{ "messages": [...] }`. You **must** access the array using `data.messages`.
            - On success, clear the guestbook container and loop through `data.messages`, displaying `nama`, `kehadiran`, and `ucapan`.
        - **On Page Load Logic (CRITICAL):** 
            You MUST include a script that runs on page load:
            ```javascript
            window.addEventListener('DOMContentLoaded', () => {
                const urlParams = new URLSearchParams(window.location.search);
                const guestName = urlParams.get('to');
                if (guestName) {
                    const decodedName = decodeURIComponent(guestName.replace(/\+/g, ' '));
                    const displayElement = document.getElementById('guest-name-display');
                    if (displayElement) displayElement.innerText = decodedName;
                    
                    const rsvpInput = document.getElementById('rsvp-name');
                    if (rsvpInput) {
                        rsvpInput.value = decodedName;
                        rsvpInput.readOnly = true;
                    }
                }
                loadRsvpMessages();
            });
            ```
        - **On Form Submission:**
            - After a successful `POST` to `/api/invitations/[SLUG]/rsvp` with the form data, you **must** call `loadRsvpMessages()` again to refresh the list with the new message.
        - Display an error message inside the container if the `fetch` call fails.
    """

    # Helper to format date for JS
    event_date_iso = data.get('tanggalAcara') or ''
    event_time = data.get('waktuAcara') or '00:00:00'
    if event_date_iso and event_time and ':' in str(event_time):
        event_date_iso = f"{event_date_iso}T{event_time}"

    # Generate gallery photos HTML in Python
    gallery_photos = data.get('galeriFoto')
    if gallery_photos is None:
        gallery_photos = []
    
    gallery_html = ""
    if isinstance(gallery_photos, list) and gallery_photos:
        for i, url in enumerate(gallery_photos):
            col_span = ""
            if len(gallery_photos) > 3 and i >= len(gallery_photos) - 2:
                col_span = "col-span-2 md:col-span-1"
            gallery_html += f'<div class="scroll-reveal {col_span}"><img src="{url}" alt="Gallery Image" class="rounded-lg shadow-lg w-full h-full object-cover aspect-square transition-transform transform hover:scale-105"></div>\n                        '

    # Set background image to first gallery photo if available
    background_url = gallery_photos[0] if gallery_photos else 'N/A'

    # Check if music URL is valid
    music_url = data.get('musik') or 'N/A'
    has_music = music_url != 'N/A' and music_url.strip() != ''

    # Manually replace all placeholders in the template, ensuring no None values are passed to replace()
    prompt = prompt_template.replace("[SLUG]", data.get('slug') or 'N/A')
    prompt = prompt.replace("[BRIDE_NAME]", data.get('namaMempelaiWanita') or 'N/A')
    prompt = prompt.replace("[BRIDE_PARENTS]", f"{data.get('namaAyahMempelaiWanita') or 'Bapak Mempelai Wanita'} & {data.get('namaIbuMempelaiWanita') or 'Ibu Mempelai Wanita'}")
    prompt = prompt.replace("[GROOM_NAME]", data.get('namaMempelaiPria') or 'N/A')
    prompt = prompt.replace("[GROOM_PARENTS]", f"{data.get('namaAyahMempelaiPria') or 'Bapak Mempelai Pria'} & {data.get('namaIbuMempelaiPria') or 'Ibu Mempelai Pria'}")
    prompt = prompt.replace("[EVENT_DATE]", data.get('tanggalAcara') or 'Tanggal Acara')
    prompt = prompt.replace("[EVENT_DATE_ISO]", event_date_iso or "")
    prompt = prompt.replace("[CEREMONY_TIME]", data.get('waktuAcara') or 'Waktu Acara')
    prompt = prompt.replace("[CEREMONY_LOCATION]", data.get('lokasiAcara') or 'Lokasi Acara')
    prompt = prompt.replace("[RECEPTION_TIME]", data.get('waktuResepsi') or 'Waktu Resepsi')
    prompt = prompt.replace("[RECEPTION_LOCATION]", data.get('tempatResepsi') or 'Lokasi Resepsi')
    prompt = prompt.replace("[COLOR_THEME]", data.get('temaWarna') or 'Classic Gold')
    prompt = prompt.replace("[INVITATION_STYLE]", data.get('jenisUndangan') or 'Modern Minimalist')
    prompt = prompt.replace("[RELIGION]", data.get('agama') or 'Lainnya')
    prompt = prompt.replace("[MUSIC_URL]", music_url)
    prompt = prompt.replace("[BRIDE_PHOTO_URL]", data.get('fotoMempelaiWanita') or 'N/A')
    prompt = prompt.replace("[GROOM_PHOTO_URL]", data.get('fotoMempelaiPria') or 'N/A')
    prompt = prompt.replace("[COVER_PHOTO_URL]", data.get('fotoCover') or 'N/A')
    prompt = prompt.replace("[GALLERY_PHOTOS_HTML]", gallery_html.strip())
    prompt = prompt.replace("[SPECIAL_NOTES]", data.get('catatanKhusus') or 'N/A')
    prompt = prompt.replace("[BACKGROUND_URL]", background_url)

    # Process Hadiah (Gifts)
    hadiah_list = data.get('hadiah')
    hadiah_html_text = ""
    frontend_url = data.get('frontendUrl', 'https://cartaai.my.id').rstrip('/')
    
    if isinstance(hadiah_list, list) and hadiah_list:
        for idx, h in enumerate(hadiah_list):
            bank_name = h.get('namaBank', '')
            logo_html_or_text = f"<span class='text-xl font-bold italic text-slate-800'>{bank_name}</span>"
            if bank_name.upper() in ["BCA", "BNI", "BRI", "MANDIRI"]:
                logo_url = f"https://sckwugoazrkjdulqzxoq.supabase.co/storage/v1/object/public/invitation-assets/static_banks/{bank_name.lower()}.png"
                logo_html_or_text = f"<img src='{logo_url}' alt='{bank_name} Logo' class='h-6 md:h-8 w-auto object-contain' />"
            
            acc_num = h.get('noRekening', '')
            acc_name = h.get('namaRekening', '')
            
            card_html = f'''
            <div class="relative w-full max-w-md mx-auto rounded-2xl shadow-xl overflow-hidden mb-6" style="background-image: url('https://sckwugoazrkjdulqzxoq.supabase.co/storage/v1/object/public/invitation-assets/static_banks/card.png'); background-size: 100% 100%; background-repeat: no-repeat; background-position: center; min-height: 220px;">
                <div class="absolute inset-0 bg-black/5 bg-blend-overlay"></div>
                <div class="relative z-10 w-full h-full p-6 flex flex-col justify-between min-h-[220px]">
                    <div class="flex justify-between items-start w-full">
                        <div></div>
                        <div class="h-8 flex justify-end">
                            {logo_html_or_text}
                        </div>
                    </div>
                    
                    <div class="mt-4 mb-2">
                        <img src="https://sckwugoazrkjdulqzxoq.supabase.co/storage/v1/object/public/invitation-assets/static_banks/card-banks.png" alt="Chip" class="w-12 h-auto object-contain rounded-sm" />
                    </div>
                    
                    <div class="mt-auto">
                        <div class="text-2xl font-bold tracking-widest text-[#1a202c] drop-shadow-sm mb-1">
                            {acc_num}
                        </div>
                        <div class="flex justify-between items-end">
                            <div class="text-[#4a5568] font-medium tracking-wide uppercase text-sm">
                                {acc_name}
                            </div>
                            <button onclick="navigator.clipboard.writeText('{acc_num}'); alert('Nomor Rekening berhasil disalin!');" class="bg-slate-500/80 hover:bg-slate-600 text-white px-3 py-1.5 rounded-md flex items-center gap-2 text-sm backdrop-blur-sm transition-all focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer pointer-events-auto">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                                Salin
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            '''
            hadiah_html_text += card_html
    elif isinstance(hadiah_list, dict):
         bank_name = hadiah_list.get('namaBank', '')
         logo_html_or_text = f"<span class='text-xl font-bold italic text-slate-800'>{bank_name}</span>"
         if bank_name.upper() in ["BCA", "BNI", "BRI", "MANDIRI"]:
                logo_url = f"https://sckwugoazrkjdulqzxoq.supabase.co/storage/v1/object/public/invitation-assets/static_banks/{bank_name.lower()}.png"
                logo_html_or_text = f"<img src='{logo_url}' alt='{bank_name} Logo' class='h-6 md:h-8 w-auto object-contain' />"
         
         acc_num = hadiah_list.get('noRekening', '')
         acc_name = hadiah_list.get('namaRekening', '')
         card_html = f'''
            <div class="relative w-full max-w-md mx-auto rounded-2xl shadow-xl overflow-hidden mb-6" style="background-image: url('https://sckwugoazrkjdulqzxoq.supabase.co/storage/v1/object/public/invitation-assets/static_banks/card.png'); background-size: 100% 100%; background-repeat: no-repeat; background-position: center; min-height: 220px;">
                <div class="absolute inset-0 bg-black/5 bg-blend-overlay"></div>
                <div class="relative z-10 w-full h-full p-6 flex flex-col justify-between min-h-[220px]">
                    <div class="flex justify-between items-start w-full">
                        <div></div>
                        <div class="h-8 flex justify-end">
                            {logo_html_or_text}
                        </div>
                    </div>
                    
                    <div class="mt-4 mb-2">
                        <img src="https://sckwugoazrkjdulqzxoq.supabase.co/storage/v1/object/public/invitation-assets/static_banks/card-banks.png" alt="Chip" class="w-12 h-auto object-contain rounded-sm" />
                    </div>
                    
                    <div class="mt-auto">
                        <div class="text-2xl font-bold tracking-widest text-[#1a202c] drop-shadow-sm mb-1">
                            {acc_num}
                        </div>
                        <div class="flex justify-between items-end">
                            <div class="text-[#4a5568] font-medium tracking-wide uppercase text-sm">
                                {acc_name}
                            </div>
                            <button onclick="navigator.clipboard.writeText('{acc_num}'); alert('Nomor Rekening berhasil disalin!');" class="bg-slate-500/80 hover:bg-slate-600 text-white px-3 py-1.5 rounded-md flex items-center gap-2 text-sm backdrop-blur-sm transition-all focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer pointer-events-auto">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                                Salin
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            '''
         hadiah_html_text += card_html
         
    prompt = prompt.replace("[HADIAH_HTML]", hadiah_html_text)
    prompt = prompt.replace("[FRONTEND_URL]", frontend_url)

    # Add explicit instructions for music and images
    if has_music:
        prompt += """\n\nIMPORTANT: Include the following audio element and music toggle button EXACTLY as shown below in your HTML. Do not alter the id attributes.
<audio id="bg-music" loop autoplay>
    <source src="[MUSIC_URL]" type="audio/mpeg">
</audio>
<button id="music-toggle" onclick="document.getElementById('bg-music').paused ? document.getElementById('bg-music').play() : document.getElementById('bg-music').pause()" style="position: fixed; bottom: 20px; right: 20px; z-index: 1000; background: white; padding: 10px; border-radius: 50%; box-shadow: 0 4px 6px rgba(0,0,0,0.1); font-size: 24px;">
    🎵
</button>
Make sure to replace [MUSIC_URL] with the actual URL.
"""
    else:
        prompt += "\n\nIMPORTANT: Do not include any audio element or music toggle button since no music URL was provided."

    prompt += "\n\nCRITICAL: Use the exact URLs provided for images without any modification. Use [BRIDE_PHOTO_URL] for the bride's photo and [GROOM_PHOTO_URL] for the groom's photo. Include all gallery images exactly as provided in [GALLERY_PHOTOS_HTML]."

    try:
        response = model.generate_content(prompt)
        # Clean up the response to ensure it's just raw HTML
        html_content = response.text.strip()
        if html_content.startswith("```html"):
            html_content = html_content[7:]
        if html_content.endswith("```"):
            html_content = html_content[:-3]
        
        return html_content.strip()
    except Exception as e:
        print(f"An error occurred while generating HTML: {e}")
        return f"<html><body><h1>Error Generating Invitation</h1><p>{e}</p></body></html>"