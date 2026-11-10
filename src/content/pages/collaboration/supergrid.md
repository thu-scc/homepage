---
title: "SuperGRID: fast data processing system for GRID 2.0"
lead: We rebuilt the GRID mission's satellite telemetry preprocessing as a parallel workflow, cutting the compute time of a representative pass from 196.1 s to 18.0 s.
---

From 2024 to 2026 the team worked with the GRID Group on the mission's data preprocessing. [GRID (Gamma-Ray Integrated Detectors)](https://grid.tsinghua.edu.cn/site/) is a space-science mission aimed at monitoring transient gamma-ray sources, built as a network of nanosatellites. To date 13 satellite payloads have been launched (as of August 2026), with 5 detectors operating in orbit, realizing a preliminary nanosatellite science-observation constellation that explores continuous monitoring of gamma-ray bursts (GRBs) over the whole sky. GRBs last from milliseconds to several minutes, followed by scientifically valuable afterglows. Since GW 170817, the field has also relied on associating GRBs with gravitational-wave and neutrino triggers, which demands complete, low-latency data processing for every pass. GRID is moving from the verification phase of 13 CubeSat payloads toward a constellation of ten to twenty satellites. Each satellite downlinks its acquired data during a transmission window; the data then go through cleaning, filtering, T90 calculation, and so on, yielding the GRB identification. Efficient processing of the whole data link is the prerequisite for observing the scientifically valuable GRB afterglows.

The first link in the data chain is the preprocessing software. The original preprocessing software consisted of four Python scripts in which all data processing ran serially, and the scripts were coupled to each other only through disk files. We carried out a two-layer redesign at the architectural level. The first layer organizes the entire data link into a workflow framework: each preprocessing stage becomes a node in a workflow graph, the data dependencies between nodes are expressed explicitly through typed edges, and the explicit information about data flow and concurrency makes pipeline parallelism and batch parallelism between stages a built-in capability of the framework, without requiring manual orchestration by the user. The second layer is an abstraction of data-access and processing primitives inside the nodes: the read, write, verification, unpacking, and calibration operations that were previously buried in the scripts and processed record-by-record in loops are lifted into primitive interfaces of the framework; the user only declares what each step does, and can conveniently adapt a node's operation to different satellite data sources. The efficient implementation of the primitives (vectorization, thread parallelism, batched I/O) is provided by the framework's backend engine, so the user does not have to repeatedly hand-write loop unrolling or parallelization for different satellite sources. Together, these two layers turn the original serial preprocessing script chain into an efficient data-processing workflow that parallelizes automatically on demand and makes performance easily observable.

On a representative satellite pass, the preprocessing time dropped from 196.1 s to 18.0 s (10.9× faster), and a complete pass including I/O takes about 44 s. The output files of the optimized version are identical to the original implementation, meeting the correctness requirement. The new design also changes the cost of adapting to different satellite payloads in the future: a new payload, calibration, or product format becomes one or more additional nodes on the graph, rather than a rewrite of the entire analysis chain.

## Gamma-ray bursts and GRID

Gamma-ray bursts were discovered in 1967: the Vela satellites, launched to monitor nuclear tests, recorded gamma-ray flashes from the cosmos. One to three bursts arrive at Earth every day, lasting from milliseconds to several minutes; the brightest release in a few seconds the energy equivalent to the Sun's total output over its lifetime. Nearly sixty years later, the general properties of these bursts are clear, but the radiation mechanism is still under study.

The possibility of associating GRBs with other messengers was established by GW 170817: a binary neutron-star merger, first observed by gravitational-wave detectors, whose gamma-ray counterpart arrived 1.7 s later and was recorded by a small satellite pointed at that sky region by chance. Detecting such coincidences at a usable rate requires three conditions simultaneously: sky coverage large enough, localization accuracy sufficient to guide follow-up telescopes, and observation duration long enough not to miss short bursts. A network of small satellites can provide all three at relatively low cost. This is the basic idea behind GRID.

The GRID program (Gamma Ray Integrated Detectors) began in 2016 as a student project at Tsinghua University. The payload occupies 0.5 U, reads out a GAGG:Ce scintillator with an SiPM array, and covers the energy range 10 keV to 2 MeV. Thirteen payloads have been placed in orbit aboard CubeSats developed by several universities. The collaboration has published GRB 210121A, GRID's first scientific result; GRB 230703A was the first burst GRID led the localization of, using GRID-03B's Earth-occultation geometry to rule out Cygnus X-1; GRB 230812B was the third-brightest burst in history, and GRID-05B provided the only unsaturated observation of this event.

![An exploded view shows the detector payload and its electronics.](../../../assets/projects/supergrid/01.png)

*Figure 1. Exploded view of the payload, from the entrance window and GAGG:Ce crystal, through the SiPM board, to the front-end and acquisition electronics, stacked into 0.5 U.*

![Light curves compare observations of GRB 230812B from three instruments.](../../../assets/projects/supergrid/02.png)

*Figure 2. GRB 230812B recorded simultaneously by Fermi/GBM, GECAM, and GRID; the third panel is GRID's data, also the only unsaturated observation of this third-brightest burst in history.*

GRID 2.0 aims to become an instrument, not just a verification effort: ten to twenty satellites, a MeV Compton telescope covering the band left open after COMPTEL, with an expected detection of more than 160 bursts per year.

## Where preprocessing sits in the pipeline

An observation goes through four steps before reaching the scientists; this collaboration topic addresses the second step.

1. Downlink. The satellite stores its observations and downlinks them all at once during a pass, producing one .dat file of several hundred megabytes per pass.
2. Preprocessing. Raw telemetry is converted into standard scientific event files: frame cutting, verification, unpacking, energy calibration, and writing headers and extensions. These data themselves can be openly released for astronomers worldwide to conduct follow-up scientific analysis. This is the stage discussed in this article.
3. Scientific analysis. Using HEASOFT, XSPEC, and the collaboration's own tools for light curves, spectra, localization, and spectral fitting.
4. Public release. Issuing a GCN Circular for other observatories to follow up.

![Ground tracks show eight GRID payloads over one orbit.](../../../assets/projects/supergrid/03.png)

*Figure 3. Ground tracks of eight of the thirteen in-orbit payloads over one orbit, 28 July 2024. Each track corresponds to a pass that will produce a file; the order of these passes does not reflect scientific priority.*

## The original pipeline

In the original implementation, this stage consisted of four programs run in sequence, each writing a FITS file for the next to read.

1. Frame cutting. Search the .dat buffer for LVDS frames, the physical-layer encapsulation emitted by the payload electronics. Each candidate frame is checked against its header, tail, and CRC-16; passing frames are stripped to the application layer and sorted by frame type: time-tagged events, spectra, and housekeeping.
2. Unpacking. Each packet is a fixed-length binary record with bit-level fields spanning bytes. Unpacking turns them into columns: UTC seconds, timestamp offset, channel number, ADC value.
3. Event reconstruction. Calibration happens here. The timestamp is refined to sub-second precision (about 12 ns) by dividing the scale offset by the crystal-oscillator frequency 99,998,665 Hz. ADC values are corrected per channel using temperature and bias calibration, then converted to energy with a piecewise quadratic polynomial, switching segments at 50.2 keV to match the detector's nonlinearity. Events are regrouped by channel.
4. Formatting. The results are packaged into astronomical products: standard headers, an EBOUNDS extension giving energy boundaries, a GTI extension giving good time intervals, a PI column binned by energy, 4 μs dead time per event, and an event-type flag. The output is the file HEASOFT can open.

![A diagram shows the data structures from the byte stream to the FITS file.](../../../assets/projects/supergrid/04.png)

*Figure 4. Data structures across the four processing stages. Records are located by a sync word rather than a fixed offset, which is why the original implementation scanned the whole buffer with a regular expression; after that, every field's position is fixed. The two main rewrites in row 04 target the same step: turning 41 fixed offsets into five columns, completed for all packets at once.*

The first three stages each write an intermediate product read by the next stage. On the GRID-11B test data file, the four stages total 467.3 s: frame cutting 31.4 s, unpacking 194.0 s, reconstruction 224.4 s, formatting 17.5 s. Reconstruction dominates, and is the only stage doing arithmetic per event, yet most of its 224.4 s is spent assembling output arrays rather than computing; the 194.0 s of unpacking is mostly spent fetching fields one struct at a time.

Most of this time comes from four physics-independent inefficiencies: a regular expression scanning the whole buffer although frame positions are predictable; every packet going through a Python-layer struct.unpack loop; every vectorized result being converted to a Python list and back; and every stage boundary writing a full file and reading it back again.

## What we built

The preprocessing reimplementation proceeds in two layers: first port the original scripts onto the workflow framework so the data link becomes an observable, automatically parallelizable workflow; then rewrite the record-by-record processing logic inside the workflow nodes through the framework's primitive interfaces, with the framework providing an efficient concurrent implementation.

### A workflow framework

The original preprocessing scripts consisted of multiple scripts that exchanged intermediate data through the filesystem, which is inefficient. We reorganized the entire link into a workflow graph: each stage is a node, and the data dependencies between nodes are expressed explicitly through typed edges. The framework manages data flow and concurrency: pipeline parallelism, batch accumulation, continuous flow, and fan-out between stages are all declared through the edges' transmission semantics. This means that when data volume grows or latency requirements tighten, the concurrency strategy is a configuration item of the framework, without requiring developers to manually optimize parallel data-processing logic. The data unit passed between nodes can be a number, an array, or any Python object. For example, nodes can pass a dictionary holding numpy arrays directly, without serializing it into an array before passing.

![A workflow graph connects the four preprocessing stages through bridge nodes.](../../../assets/projects/supergrid/05.png)

*Figure 5. The four stages merged into one workflow. Node names match the code; the three golden arrows are bridge nodes, which replace the "write a FITS, then read it back" pattern with direct computation and asynchronous I/O.*

The framework can run the same graph in several execution modes, and the developer chooses the appropriate one: fully sequential (for debugging and comparison), pipeline parallel (adjacent stages overlap execution), or producer-consumer backpressure. After each run, the framework's built-in performance monitor records and outputs per-node timing, making the cost and distribution of each link in the data chain visible; this is also the observability convenience brought by the workflow framework.

For a newly added satellite payload, there is no need to rebuild the entire preprocessing script; one only adds the new data source and processing nodes to the current workflow, and nodes with identical processing logic can be reused directly. The framework internally auto-detects multiple data-flow paths and runs them in parallel.

### Data processing primitives

After the workflow framework separates computation and I/O into different nodes, we further optimized the previously scattered record-by-record serial processing operations inside the nodes. We abstracted these operations into primitive interfaces: the user declares what each step does (read a file, verify a batch of frames, unpack a set of records, calibrate a column of ADC values), and the framework's backend engine provides an efficient implementation of vectorization, thread parallelism, and batched I/O, so the user need not hand-write loop unrolling or parallelization. The primitives are:

- `crc16_xmodem_nd` (verify) replaces a per-frame CRC-16 in a Python loop: one numba call computes a 2-D uint8 array, independent of frame length.
- `unpack_event_packets` (unpack) replaces one `struct.unpack` per packet: 528-byte packets are stacked into an array, fields are extracted by shift and mask, and packet headers are broadcast with `np.repeat`.
- `calibrate_adc_vectorized` (calibrate) replaces a per-channel, per-event loop: one Boolean mask per channel, the whole column done at once.
- `adc_to_energy_vectorized` (convert) replaces one quadratic per event: both segments are computed, `np.where` chooses at 50.2 keV, and coefficients are taken per channel from the calibration table.
- `create_spectrum_column` (format) replaces per-row Python object construction: the whole column is assembled as an array and kept as an array.

The names are identifiers from `examples/dataflow_prepipeline`.

The design goal of this set of primitives is that each primitive exposes only "what to do" outward, while "how to do it" is decided by the framework backend, so the user need not hand-write loop unrolling or parallelization. Below, two primitives are given as examples, with their interface definitions and implementation notes.

The first example, `crc16_xmodem_nd`, verifies frames of any length in one batch. It takes a 2-D uint8 array with one frame per row and returns a 1-D uint16 array with one CRC-16 checksum per frame:

```python
@jit(nopython=True)
def crc16_xmodem_nd(data):
    data = data.reshape(-1, data.shape[-1])      # keep only the last dim; frame length is irrelevant
    crc_result = np.zeros(data.shape[0], dtype=np.uint16)
    for i in range(data.shape[0]):
        for j in range(data.shape[1]):
            crc_result[i] = (crc_result[i] << 8) ^ crc16_ccitt_table[(crc_result[i] >> 8) ^ data[i, j]]
    return crc_result
```

The key is `reshape(-1, data.shape[-1])`: the primitive only recognizes "the last dimension is a byte stream" and does not assume how long a frame is. Different GRID payloads and frame types emit frames of varying lengths (554, 522, 185 bytes, …); the caller simply feeds the corresponding byte segment `np.frombuffer(frame[0:N], uint8)` from its own node. The same verification primitive thus serves multiple frame types: the frame length, a "data-source attribute," stays with the caller rather than being written into the primitive.

The second example, `adc_to_energy_vectorized`, converts a whole column of calibrated ADC values (a float64 array) into a whole column of energies in keV. It also takes the whole column of channel numbers (0 to 3), the same length as the ADC values, and records channel 3 as NaN:

```python
def adc_to_energy_vectorized(self, adc_calibrated, channels):
    adc_calibrated = np.asarray(adc_calibrated, dtype=np.float64)
    channels = np.asarray(channels)
    energies = np.full(len(adc_calibrated), np.nan)
    for ch in range(3):                          # per valid channel
        mask = channels == ch
        adc_ch = adc_calibrated[mask]
        a_l, b_l, c_l = self.ec_low[ch]          # low-energy coefficients for this satellite, this channel
        a_h, b_h, c_h = self.ec_high[ch]         # high-energy coefficients
        energy_low  = a_l * adc_ch**2 + b_l * adc_ch + c_l
        energy_high = a_h * adc_ch**2 + b_h * adc_ch + c_h
        energies[mask] = np.where(energy_low <= 50.2, energy_low, energy_high)
    return energies
```

This primitive is a method of the detector object, not a standalone function, because the conversion coefficients `self.ec_low` / `self.ec_high` are per-satellite and per-channel. Each payload receives a set of quadratic coefficients after factory and in-orbit calibration, loaded from a calibration JSON by `read_ec_coef()`. The primitive itself is only responsible for a fixed vectorized flow: take the coefficients per channel, evaluate the polynomial over the whole column, and choose the segment at 50.2 keV. Switching to a different satellite only requires swapping a coefficient file, without touching a single line of the loop. This is precisely how one function adapts to different data sources: differences among data sources (byte layout, channel count, calibration coefficients) are injected through parameters and the detector subclass, while the primitive's algorithmic skeleton stays unchanged.

The data-processing primitives abstract a layer of record-by-record loops into a single batch operation: the user declares "calibrate the ADC values into energy," and the framework backend completes it with whole-column array operations, so twenty million events become one pass of array operations rather than twenty million iterations. The key design decision is that data stays in array form throughout the chain: channel grouping, PI binning, and event-type determination are all Boolean masks on the original values, and the results remain numpy arrays all the way to output. This eliminates the overhead of repeatedly converting between arrays and Python lists in the middle of the chain in the original implementation. That overhead mattered more than some algorithmic rewrites.

## Results

All numbers below come from the same representative input file, processed by both implementations on the same machine. In the refactoring, three nodes were split into compute nodes and write nodes, so their original-implementation time includes, and the optimized time excludes, the FITS write; these three nodes are listed separately in the second table and given no speedup ratio. The remaining six nodes do the same work before and after refactoring, with compute time dropping from 196.1 s to 18.0 s.

### Nodes whose work was unchanged

| Node | Original to optimized (s) | Speedup |
| --- | --- | ---: |
| `tte_classifier` | 10.1 to 7.7 | 1.3× |
| `event_unpacker` | 51.3 to 5.9 | 8.7× |
| `spec_unpacker` | 30.7 to 0.1 | 307× |
| `adc_calibrator` | 23.0 to 0.2 | 115× |
| `energy_converter` | 63.5 to 1.2 | 53× |
| `events_formatter` | 17.5 to 2.9 | 6.0× |
| Six nodes total | 196.1 to 18.0 | 10.9× |

*Both times are compute time and neither includes I/O, so the ratio is an apples-to-apples comparison. `tte_classifier` belongs to frame cutting, the two unpackers to unpacking, `adc_calibrator` and `energy_converter` to reconstruction, and `events_formatter` to formatting.*

Within the six comparable nodes, the gains are uneven. `spec_unpacker` dropped from 30.7 s to 0.1 s because there was no arithmetic there to begin with: a 20×8 array is reshaped element-wise. `adc_calibrator` and `energy_converter`, after per-channel correction and piecewise-polynomial evaluation were changed to whole-column evaluation, dropped to 0.2 s and 1.2 s respectively. The two nodes with the smallest gains are `events_formatter` (6.0×) and `tte_classifier` (1.3×); they are also the two hardest for vectorization to cover: most of their time is spent in bookkeeping around the arrays rather than arithmetic on them. Summed by stage, unpacking and reconstruction account for almost all of the drop. Frame cutting changed least because it still must read and verify every byte in the buffer.

### Nodes split during refactoring

| Node | Before (s) | Compute (s) | Write (s) |
| --- | ---: | ---: | ---: |
| `hk_handler` | 21.3 | 2.2 | 14.8 |
| `hk_unpacker` | 112.0 | 1.3 | 39.7 |
| `event_writer` | 137.9 | 1.4 | 43.0 |

*The Before column is the original implementation's time, which includes the intermediate FITS write performed by the node itself. After splitting, that write became an independent node (`packet_saver`, `unpacked_data_saver` and `event_saver` respectively), and the Write column gives its actually measured cost at runtime. The Before and Compute columns therefore do not measure the same thing and do not form a speedup ratio. Comparing the original total of 467.3 s with the optimized total of 22.9 s would count "moved-away I/O" as "removed I/O," so this article does not adopt that ratio. The two tables reconcile: original 196.1 + 271.2 = 467.3 s, optimized 18.0 + 4.9 = 22.9 s.*

The I/O side changed differently and is not counted in any of the ratios above. In the original implementation, each of the three stage boundaries required writing a complete intermediate FITS file and then reading it back; with the bridge, these writes are skipped and data are passed in memory as a dictionary. The total measured runtime cost of the three write nodes is 97.5 s. The remaining I/O per file is the initial .dat read of 9.5 s and the final EVT write of 11.5 s, both spread across the thread pool; adding the 22.9 s of computation, a complete pass takes about 44 s.

Correctness was checked the collaboration's way: both implementations were run once on the same input, compared extension by extension and column by column, and the results agreed. A few faster rewrites were abandoned because some value differed in the last digit.

Several measurement caveats must be stated: it is one representative file on one machine; the figures are per-node times rather than a single end-to-end duration; the parallel path only takes effect when one batch contains multiple files, so it contributes nothing to the numbers above; the four original scripts were timed node-by-node rather than as one run, so no end-to-end ratio is given for the original. The 10.9× applies to the six nodes above on this workload, not a benchmark score for the framework.

## What it means for GRID 2.0

The goal of the GRID 2.0 data system is to shorten the time from "data downlink" to "GCN notice issued" from days to hours. Preprocessing was never the whole of this latency, but it is the part that must be paid file by file and cannot be skipped.

At about 44 s per pass (incl. I/O), a single machine processing a day's data for a ten-satellite constellation takes about an hour, so this stage is no longer a scheduling constraint. The remaining work lies in other links of the chain: IoTDB storage for constellation products, and an agent that ingests triggers, runs the analysis, and drafts the notice.
