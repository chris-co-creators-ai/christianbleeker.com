#!/usr/bin/env swift
//
// cutout-portrait.swift
//
// Snijdt de hoofdpersoon uit een portretfoto en schrijft een PNG met een echt alfakanaal — geen
// `mix-blend-mode`-truc meer nodig om een studio-achtergrond te laten verdwijnen.
//
// Probeert eerst de ingebouwde onderwerpherkenning van macOS (Vision-framework,
// `VNGenerateForegroundInstanceMaskRequest` — hetzelfde mechanisme als "Onderwerp kopiëren" in
// Voorvertoning/Foto's, ML-gebaseerd, draait op de Neural Engine).
//
// ── Val terug op kleurafstand-keying als Vision niet beschikbaar is ─────────────────────────
// In de Bash-sandbox waarin dit script gebouwd is, faalt `VNGenerateForegroundInstanceMaskRequest`
// altijd met `ANECF error ... (DESIGN)` — de Apple Neural Engine-compileerservice is in die
// sandbox niet bereikbaar (geen schrijfrechten-probleem: gereproduceerd met zowel het
// JIT-uitgevoerde script als een gecompileerde, ad-hoc gesigneerde binary, met `HOME`/`TMPDIR`
// omgeleid naar schrijfbare mappen — dat sluit een cache-permissieprobleem uit). Dat is een
// grens van de sandbox, geen instelling die dit script kan omzeilen.
// Daarom heeft dit script een tweede, niet-ML-pad: een per-rij kleurafstand-keying tegen de
// achtergrondkleur (klassieke "green screen"-techniek, hier op een effen grijze studio-
// achtergrond), volledig op de CPU via een rechtstreekse pixelbuffer-lus — geen Neural Engine,
// geen GPU-shader-compilatie nodig, dus geen kans op dezelfde blokkade. Dit pad wordt alleen
// gebruikt als het Vision-pad faalt; op een niet-gesandboxte Mac gebruikt dit script gewoon de
// ML-onderwerpherkenning.
//
// gebruik:
//   swift scripts/cutout-portrait.swift <input.jpg> <output.png> [bgSampleX0 bgSampleX1]
//
// De optionele twee laatste argumenten geven de x-pixel-range (in het INPUT-beeld) van een
// kolom die op elke rij zeker achtergrond is — nodig voor de fallback-keying. Standaard 5..120
// (past bij de crops die voor deze template gebruikt zijn: het onderwerp staat rechts in beeld).

import Foundation
import Vision
import CoreImage
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

let args = CommandLine.arguments
guard args.count >= 3 else {
    FileHandle.standardError.write("Gebruik: swift cutout-portrait.swift <input> <output.png> [bgX0 bgX1] [bgY0 bgY1] [--bg-rect x0,y0,x1,y1 ...] [--include-bottom-edge]\n".data(using: .utf8)!)
    exit(1)
}
let inputPath = args[1]
let outputPath = args[2]
let bgX0 = args.count > 3 ? Int(args[3]) ?? 5 : 5
let bgX1 = args.count > 4 ? Int(args[4]) ?? 120 : 120
// De ondergrens van een staand portret is meestal geen achtergrond maar kleding die door het
// bijsnijden is afgekapt (hier: een grijze rok, bijna dezelfde toon als de achtergrond) — vloed-
// vullen vanaf die rand lekt dan via een schaduwplooi omhoog het onderwerp in (gemeten en
// gerepareerd tijdens het maken van dit script, zie CREDITS.md). Standaard dus NIET vanaf de
// onderrand vullen; `--include-bottom-edge` zet dat aan voor een crop waarvan de onderrand wél
// echte achtergrond is.
let includeBottomEdge = args.contains("--include-bottom-edge")

let inputURL = URL(fileURLWithPath: inputPath)
let outputURL = URL(fileURLWithPath: outputPath)

func writePNG(_ cgImage: CGImage, to url: URL) -> Bool {
    guard let destination = CGImageDestinationCreateWithURL(url as CFURL, UTType.png.identifier as CFString, 1, nil) else {
        return false
    }
    CGImageDestinationAddImage(destination, cgImage, nil)
    return CGImageDestinationFinalize(destination)
}

// ── Pad 1: Vision-onderwerpherkenning (ML) ────────────────────────────────────────────────────
func tryVisionCutout() -> CGImage? {
    guard let ciImage = CIImage(contentsOf: inputURL) else { return nil }
    let handler = VNImageRequestHandler(ciImage: ciImage, options: [:])
    let request = VNGenerateForegroundInstanceMaskRequest()
    do {
        try handler.perform([request])
        guard let result = request.results?.first else { return nil }
        let maskedPixelBuffer = try result.generateMaskedImage(
            ofInstances: result.allInstances, from: handler, croppedToInstancesExtent: false
        )
        let maskedImage = CIImage(cvPixelBuffer: maskedPixelBuffer)
        let context = CIContext()
        return context.createCGImage(maskedImage, from: maskedImage.extent)
    } catch {
        FileHandle.standardError.write("Vision-pad niet beschikbaar (\(error.localizedDescription)) — val terug op kleurafstand-keying.\n".data(using: .utf8)!)
        return nil
    }
}

// ── Pad 2: kleurafstand-keying (CPU, geen ML) ─────────────────────────────────────────────────
func colorDistanceKeyCutout() -> CGImage? {
    guard let imgSource = CGImageSourceCreateWithURL(inputURL as CFURL, nil),
          let srcImage = CGImageSourceCreateImageAtIndex(imgSource, 0, nil)
    else { return nil }

    let width = srcImage.width
    let height = srcImage.height
    let bytesPerPixel = 4
    let bytesPerRow = width * bytesPerPixel
    var pixels = [UInt8](repeating: 0, count: height * bytesPerRow)

    let colorSpace = CGColorSpaceCreateDeviceRGB()
    guard let ctx = CGContext(
        data: &pixels, width: width, height: height, bitsPerComponent: 8, bytesPerRow: bytesPerRow,
        space: colorSpace, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
    ) else { return nil }
    ctx.draw(srcImage, in: CGRect(x: 0, y: 0, width: width, height: height))

    // Betrouwbare achtergrond-steekproefvakken (x0,y0,x1,y1) — meerdere, want één smalle kolom
    // bleek niet genoeg: de studio-achtergrond loopt niet alleen verticaal in toon uiteen maar
    // ook HORIZONTAAL (een meting bevestigde dit: (50,700)≈(194,201,194) tegenover (800,400)≈een
    // duidelijk blauwer/donkerder teal) — een referentie op basis van alleen de linkerkolom
    // ondervoorspelde de rechterkant systematisch, waardoor de vloed-vulling daar niet kon
    // starten (de rand zelf werd al niet als "lijkt op achtergrond" herkend) en het grootste deel
    // van de achtergrond rechts van het onderwerp gewoon dicht bleef. Standaard drie vakken (twee
    // ver uit elkaar in x, één met veel y-bereik) zodat een 2D-vlak (a + b·x + c·y) door de drie
    // dimensies kan fitten; overschrijfbaar via `--bg-rect x0,y0,x1,y1` (herhaalbaar).
    var bgRects: [(x0: Int, y0: Int, x1: Int, y1: Int)] = []
    var ai = 0
    while ai < args.count {
        if args[ai] == "--bg-rect", ai + 1 < args.count {
            let parts = args[ai + 1].split(separator: ",").compactMap { Int($0) }
            if parts.count == 4 { bgRects.append((parts[0], parts[1], parts[2], parts[3])) }
            ai += 2
        } else {
            ai += 1
        }
    }
    if bgRects.isEmpty {
        let sampleX0 = max(0, min(bgX0, width - 1))
        let sampleX1 = max(sampleX0 + 1, min(bgX1, width))
        let sampleY0 = args.count > 6 ? Int(args[5]) ?? 0 : 0
        let sampleY1 = args.count > 7 ? Int(args[6]) ?? (height / 2) : (height / 2)
        bgRects = [(sampleX0, sampleY0, sampleX1, min(sampleY1, height))]
    }

    // Kleurafstand-drempel: "lijkt op de achtergrond" (ruim genomen — vangt ook donkere plooien
    // in een lichte stof die toevallig dicht bij het achtergrondgrijs liggen).
    let bgThresholdDefault: Double = 30
    let bgThreshold: Double = {
        for (i, a) in args.enumerated() where a == "--bg-threshold" && i + 1 < args.count {
            if let v = Double(args[i + 1]) { return v }
        }
        return bgThresholdDefault
    }()

    // 2D-vlakfit per kanaal (C ≈ a + b·x + c·y) over ALLE steekproefpixels uit alle vakken samen
    // (gewone kleinste-kwadraten via de 3×3-normaalvergelijkingen) — vangt zowel het verticale
    // als het horizontale lichtverloop in de studio-achtergrond op.
    func solve3x3(_ m: [[Double]], _ rhs: [Double]) -> [Double] {
        var a = m, b = rhs
        for col in 0..<3 {
            var pivot = col
            for row in (col + 1)..<3 where abs(a[row][col]) > abs(a[pivot][col]) { pivot = row }
            a.swapAt(col, pivot); b.swapAt(col, pivot)
            guard a[col][col] != 0 else { continue }
            for row in 0..<3 where row != col {
                let f = a[row][col] / a[col][col]
                for c in 0..<3 { a[row][c] -= f * a[col][c] }
                b[row] -= f * b[col]
            }
        }
        return (0..<3).map { a[$0][$0] != 0 ? b[$0] / a[$0][$0] : 0 }
    }

    func fitChannelPlane(_ channelOffset: Int) -> (a: Double, b: Double, c: Double) {
        var n = 0.0, sx = 0.0, sy = 0.0, sxx = 0.0, sxy = 0.0, syy = 0.0
        var sc = 0.0, sxc = 0.0, syc = 0.0
        for rect in bgRects {
            let x0 = max(0, rect.x0), x1 = min(width, rect.x1)
            let y0 = max(0, rect.y0), y1 = min(height, rect.y1)
            guard x0 < x1, y0 < y1 else { continue }
            for y in y0..<y1 {
                let rowStart = y * bytesPerRow
                let yD = Double(y)
                for x in x0..<x1 {
                    let c = Double(pixels[rowStart + x * bytesPerPixel + channelOffset])
                    let xD = Double(x)
                    n += 1; sx += xD; sy += yD; sxx += xD * xD; sxy += xD * yD; syy += yD * yD
                    sc += c; sxc += xD * c; syc += yD * c
                }
            }
        }
        guard n > 3 else { return (a: sc / max(n, 1), b: 0, c: 0) }
        let m = [[n, sx, sy], [sx, sxx, sxy], [sy, sxy, syy]]
        let rhs = [sc, sxc, syc]
        let sol = solve3x3(m, rhs)
        return (a: sol[0], b: sol[1], c: sol[2])
    }
    let fitR = fitChannelPlane(0), fitG = fitChannelPlane(1), fitB = fitChannelPlane(2)

    // distance[y*width+x] = kleurafstand tot de (geëxtrapoleerde) achtergrondreferentie op dat
    // punt.
    var distance = [Double](repeating: .greatestFiniteMagnitude, count: width * height)

    for y in 0..<height {
        let rowStart = y * bytesPerRow
        let yD = Double(y)

        for x in 0..<width {
            let xD = Double(x)
            let bgR = fitR.a + fitR.b * xD + fitR.c * yD
            let bgG = fitG.a + fitG.b * xD + fitG.c * yD
            let bgB = fitB.a + fitB.b * xD + fitB.c * yD
            let i = rowStart + x * bytesPerPixel
            let r = Double(pixels[i]), g = Double(pixels[i + 1]), b = Double(pixels[i + 2])
            distance[y * width + x] = (
                (r - bgR) * (r - bgR) + (g - bgG) * (g - bgG) + (b - bgB) * (b - bgB)
            ).squareRoot()
        }
    }

    // ── Mediaanfilter (3×3) op de afstandskaart ─────────────────────────────────────────────────
    // Nodig zodra kleding en achtergrond bijna dezelfde kleur hebben (wit-op-wit): de drempel moet
    // dan zo laag dat JPEG-compressieruis (willekeurige ±3–8-schommelingen per pixel, "zout-en-
    // peper") zelf al pixels over/onder de drempel duwt — zichtbaar als een fijn gespikkeld
    // patroon op bijvoorbeeld de schouders, ondanks een verder correcte drempel. Een mediaan over
    // de 3×3-buurt haalt die ruis eruit zonder harde randen te vervagen (in tegenstelling tot een
    // gewoon gemiddelde): op een vlak stuk (echte achtergrond, of een effen kledingstuk) verandert
    // de mediaan nauwelijks, maar losse ruis-uitschieters vallen weg.
    var distanceFiltered = distance
    for y in 0..<height {
        for x in 0..<width {
            var neighborhood: [Double] = []
            neighborhood.reserveCapacity(9)
            for dy in -1...1 {
                for dx in -1...1 {
                    let nx = x + dx, ny = y + dy
                    guard nx >= 0, nx < width, ny >= 0, ny < height else { continue }
                    neighborhood.append(distance[ny * width + nx])
                }
            }
            neighborhood.sort()
            distanceFiltered[y * width + x] = neighborhood[neighborhood.count / 2]
        }
    }
    distance = distanceFiltered

    if ProcessInfo.processInfo.environment["CUTOUT_DEBUG_DISTANCE"] != nil {
        var dbg = [UInt8](repeating: 0, count: height * bytesPerRow)
        for idx in 0..<(width * height) {
            let v = UInt8(max(0, min(255, distance[idx])))
            dbg[idx * 4] = v; dbg[idx * 4 + 1] = v; dbg[idx * 4 + 2] = v; dbg[idx * 4 + 3] = 255
        }
        if let dctx = CGContext(
            data: &dbg, width: width, height: height, bitsPerComponent: 8, bytesPerRow: bytesPerRow,
            space: colorSpace, bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue
        ), let dimg = dctx.makeImage() {
            _ = writePNG(dimg, to: URL(fileURLWithPath: outputPath + ".distance-debug.png"))
            FileHandle.standardError.write("Distance-debugbeeld geschreven: \(outputPath).distance-debug.png\n".data(using: .utf8)!)
        }
    }

    // ── Vloed-vulling vanaf de randen, niet een kale drempel op elke pixel apart ────────────────
    // Een losse kleurafstand-drempel ponst gaten in stof/huid zodra die toevallig in de buurt van
    // het achtergrondgrijs kleurt (hier gebeurde dat: schaduwplooien in de lichte blouse maten
    // net zo grijs als de achtergrond, en werden zonder deze stap ten onrechte doorzichtig — zie
    // het commentaarblok bovenaan dit bestand). Vloed-vulling lost dat op: alleen pixels die via
    // een aaneengesloten pad van "lijkt op achtergrond"-pixels verbonden zijn met de buitenrand
    // van het beeld worden achtergrond. Een schaduwplooi MIDDEN in de blouse, omringd door
    // duidelijk niet-achtergrondkleurige stof, is niet met de rand verbonden en blijft dus gewoon
    // onderdeel van het onderwerp — ook al lijkt de kleur op zichzelf op de achtergrond.
    var isBackground = [Bool](repeating: false, count: width * height)
    var queue = [Int]()
    queue.reserveCapacity(width * height / 4)

    func tryEnqueue(_ x: Int, _ y: Int) {
        guard x >= 0, x < width, y >= 0, y < height else { return }
        let idx = y * width + x
        if !isBackground[idx] && distance[idx] < bgThreshold {
            isBackground[idx] = true
            queue.append(idx)
        }
    }

    for x in 0..<width {
        tryEnqueue(x, 0)
        if includeBottomEdge { tryEnqueue(x, height - 1) }
    }
    for y in 0..<height {
        tryEnqueue(0, y)
        tryEnqueue(width - 1, y)
    }

    // 8-buren (incl. diagonalen) — een dun haarsliert van 1 px breed die orthogonaal precies over
    // een achtergrondstrook heen valt, blokkeerde de 4-buren-vulling en liet een stuk echte
    // achtergrond ONbereikt liggen ondanks een lage kleurafstand (bevestigd met het
    // distance-debugbeeld: dat stuk was daar al donker/dichtbij, dus geen drempel- maar een
    // verbindingsprobleem). Diagonale stappen "lopen" om zo'n dun obstakel heen.
    var head = 0
    while head < queue.count {
        let idx = queue[head]; head += 1
        let x = idx % width, y = idx / width
        for dy in -1...1 {
            for dx in -1...1 where !(dx == 0 && dy == 0) {
                tryEnqueue(x + dx, y + dy)
            }
        }
    }

    // Alfa: 0 voor bevestigde achtergrond, 255 voor de rest — daarna een lichte 3×3-vervaging
    // op het alfakanaal voor een zachte, niet-gekartelde rand (geen ML nodig voor deze laatste
    // stap, alleen een gemiddelde van de directe buren).
    var alphaF = [Double](repeating: 0, count: width * height)
    for idx in 0..<(width * height) {
        alphaF[idx] = isBackground[idx] ? 0 : 255
    }
    var alphaBlurred = alphaF
    let radius = 1
    for y in 0..<height {
        for x in 0..<width {
            var sum = 0.0, n = 0.0
            for dy in -radius...radius {
                for dx in -radius...radius {
                    let nx = x + dx, ny = y + dy
                    guard nx >= 0, nx < width, ny >= 0, ny < height else { continue }
                    sum += alphaF[ny * width + nx]; n += 1
                }
            }
            alphaBlurred[y * width + x] = sum / n
        }
    }

    // ── Defringe (kleur-decontaminatie) op de zachte randband ──────────────────────────────────
    // Zonder dit blijft er op een halfdoorzichtige randpixel een MENGSEL van onderwerp- en
    // achtergrondkleur staan (dat is precies hoe alpha-compositing werkt: opgeslagen kleur =
    // alpha·ware_kleur + (1-alpha)·achtergrondkleur). Op een witte achtergrond geeft dat een
    // lichte/witte zoom rond het haar zodra je het beeld op een ANDERE ondergrond (het papier van
    // de pagina) legt — precies de klacht ("gekartelde rand", "harde rand") uit de vorige ronde.
    // Los op naar de ware kleur: ware_kleur = (opgeslagen_kleur - (1-alpha)·achtergrondkleur) / alpha,
    // dezelfde formule als Photoshops "Decontaminate Colors"/defringe. `bg` hier is de
    // GEËXTRAPOLEERDE 2D-vlak-referentie op exact die (x,y) — niet een vast wit — zodat een klein
    // lichtverloop in de achtergrond ook op de rand zelf klopt.
    for y in 0..<height {
        let rowStart = y * bytesPerRow
        let yD = Double(y)
        for x in 0..<width {
            let xD = Double(x)
            let i = rowStart + x * bytesPerPixel
            let alpha = max(0, min(1, alphaBlurred[y * width + x] / 255))

            let origR = Double(pixels[i]), origG = Double(pixels[i + 1]), origB = Double(pixels[i + 2])
            var trueR = origR, trueG = origG, trueB = origB

            // Alleen op de echte randband defringen (bv. 0.03–0.97): daarbuiten is het gewoon
            // volledig onderwerp (alpha≈1, defringe = origineel) of volledig achtergrond
            // (alpha≈0, kleur doet er niet toe — straks toch 0-dekking).
            if alpha > 0.03 && alpha < 0.97 {
                let bgR = fitR.a + fitR.b * xD + fitR.c * yD
                let bgG = fitG.a + fitG.b * xD + fitG.c * yD
                let bgB = fitB.a + fitB.b * xD + fitB.c * yD
                trueR = (origR - (1 - alpha) * bgR) / alpha
                trueG = (origG - (1 - alpha) * bgG) / alpha
                trueB = (origB - (1 - alpha) * bgB) / alpha
            }

            // Bufferformaat is premultipliedLast (vereist om ermee te tekenen): sla de WARE kleur
            // herschaald naar alfa op.
            pixels[i] = UInt8(max(0, min(255, trueR * alpha)))
            pixels[i + 1] = UInt8(max(0, min(255, trueG * alpha)))
            pixels[i + 2] = UInt8(max(0, min(255, trueB * alpha)))
            pixels[i + 3] = UInt8(max(0, min(255, alpha * 255)))
        }
    }

    return ctx.makeImage()
}

var outputImage: CGImage? = tryVisionCutout()
var usedFallback = false
if outputImage == nil {
    outputImage = colorDistanceKeyCutout()
    usedFallback = true
}

guard let finalImage = outputImage else {
    FileHandle.standardError.write("Kon geen cutout maken (geen van beide paden lukte).\n".data(using: .utf8)!)
    exit(1)
}

if writePNG(finalImage, to: outputURL) {
    let pad = usedFallback ? "kleurafstand-keying (fallback, geen ML)" : "Vision-onderwerpherkenning (ML)"
    print("Cutout geschreven: \(outputPath) (\(finalImage.width)×\(finalImage.height)) via \(pad)")
} else {
    FileHandle.standardError.write("PNG wegschrijven mislukt.\n".data(using: .utf8)!)
    exit(1)
}
